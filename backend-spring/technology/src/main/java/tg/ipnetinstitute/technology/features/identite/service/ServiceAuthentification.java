package tg.ipnetinstitute.technology.features.identite.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tg.ipnetinstitute.technology.common.exception.CompteInactifException;
import tg.ipnetinstitute.technology.common.exception.RessourceIntrouvableException;
import tg.ipnetinstitute.technology.common.utils.Email;
import tg.ipnetinstitute.technology.config.Auditable;
import tg.ipnetinstitute.technology.features.identite.dto.response.TokensAcces;
import tg.ipnetinstitute.technology.features.identite.model.Utilisateur;
import tg.ipnetinstitute.technology.features.identite.repository.UtilisateurRepository;
import tg.ipnetinstitute.technology.features.identite.wrapper.JwtWrapper;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

/**
 * Service d'authentification conforme Section 5.1, EF-06 et RG-18.
 * Limitation à 5 échecs consécutifs avant verrouillage temporaire de 15 minutes.
 */
@Service
public class ServiceAuthentification {

    private static final Logger log = LoggerFactory.getLogger(ServiceAuthentification.class);

    private final UtilisateurRepository utilisateurs;
    private final PasswordEncoder passwordEncoder;
    private final JwtWrapper jwtProvider;
    private final ApplicationEventPublisher publieur;
    private final String urlFront;

    public ServiceAuthentification(UtilisateurRepository utilisateurs,
                                   PasswordEncoder passwordEncoder,
                                   JwtWrapper jwtProvider,
                                   ApplicationEventPublisher publieur,
                                   @Value("${app.front.url:http://localhost:5173}") String urlFront) {
        this.utilisateurs = utilisateurs;
        this.passwordEncoder = passwordEncoder;
        this.jwtProvider = jwtProvider;
        this.publieur = publieur;
        this.urlFront = urlFront;
    }

    @Transactional(noRollbackFor = BadCredentialsException.class)
    @Auditable(action = "CONNEXION", typeCible = "UTILISATEUR")
    public TokensAcces connecter(Email email, String motDePasse) {
        Utilisateur u = utilisateurs.findByEmail(email.valeur())
                .orElseThrow(() -> new BadCredentialsException("Identifiants incorrects"));

        if (!u.isActif()) {
            throw new CompteInactifException(u.getId());
        }

        LocalDateTime now = LocalDateTime.now();
        if (u.estVerrouille(now)) {
            throw new LockedException("Compte temporairement verrouillé pour 15 minutes suite à 5 tentatives infructueuses (Section 5.1).");
        }

        if (!passwordEncoder.matches(motDePasse, u.getMotDePasseHash())) {
            u.enregistrerEchecConnexion();
            utilisateurs.save(u);
            throw new BadCredentialsException("Identifiants incorrects");
        }

        u.reinitialiserTentatives();
        utilisateurs.save(u);
        return emettre(u);
    }

    /** Ouvre une session pour un utilisateur venant de s'inscrire (évite une reconnexion avant l'OTP). */
    @Transactional(readOnly = true)
    public TokensAcces ouvrirSession(Long utilisateurId) {
        Utilisateur u = utilisateurs.findById(utilisateurId)
                .orElseThrow(() -> new RessourceIntrouvableException("Utilisateur", utilisateurId));
        return emettre(u);
    }

    @Transactional(readOnly = true)
    public TokensAcces rafraichir(String refreshToken) {
        var claims = jwtProvider.lireJetonDeType(refreshToken, JwtWrapper.TYPE_REFRESH)
                .orElseThrow(() -> new BadCredentialsException("Jeton de rafraîchissement invalide ou expiré"));

        Long userId = Long.parseLong(claims.getSubject());
        Utilisateur u = utilisateurs.findById(userId)
                .orElseThrow(() -> new BadCredentialsException("Utilisateur non trouvé"));

        if (!u.isActif()) {
            throw new CompteInactifException(u.getId());
        }
        // Rotation stricte des tokens
        return emettre(u);
    }

    /**
     * EF-06 : demande de réinitialisation. Ne révèle jamais si l'e-mail existe (réponse identique).
     */
    @Transactional
    public void demanderReinitialisation(String emailBrut) {
        String email;
        try {
            email = new Email(emailBrut).valeur();
        } catch (RuntimeException e) {
            return; // format invalide : même réponse silencieuse
        }
        utilisateurs.findByEmail(email).filter(Utilisateur::isActif).ifPresent(u -> {
            String jeton = jwtProvider.genererJetonReinitialisation(u.getId(), empreinte(u.getMotDePasseHash()));
            String lien = urlFront + "/reinitialisation-mot-de-passe?jeton=" + URLEncoder.encode(jeton, StandardCharsets.UTF_8);
            publieur.publishEvent(new ReinitialisationMotDePasseDemandeeEvent(u.getId(), u.getEmail(), lien));
            log.info("Demande de réinitialisation du mot de passe pour l'utilisateur {}", u.getId());
        });
    }

    /** EF-06 : application du nouveau mot de passe ; le jeton devient inutilisable ensuite. */
    @Transactional
    @Auditable(action = "REINITIALISATION_MOT_DE_PASSE", typeCible = "UTILISATEUR")
    public void reinitialiser(String jeton, String nouveauMotDePasse) {
        var claims = jwtProvider.lireJetonDeType(jeton, JwtWrapper.TYPE_RESET)
                .orElseThrow(() -> new IllegalArgumentException("Lien de réinitialisation invalide ou expiré"));

        Utilisateur u = utilisateurs.findById(Long.parseLong(claims.getSubject()))
                .filter(Utilisateur::isActif)
                .orElseThrow(() -> new IllegalArgumentException("Lien de réinitialisation invalide ou expiré"));

        if (!empreinte(u.getMotDePasseHash()).equals(claims.get("empreinte", String.class))) {
            throw new IllegalArgumentException("Lien de réinitialisation déjà utilisé");
        }
        u.changerMotDePasse(passwordEncoder.encode(nouveauMotDePasse));
        utilisateurs.save(u);
    }

    private TokensAcces emettre(Utilisateur u) {
        return new TokensAcces(
                jwtProvider.genererAccessToken(u.getId(), u.getEmail(), u.getRole(), u.isEmailVerifie()),
                jwtProvider.genererRefreshToken(u.getId()),
                jwtProvider.dureeAccessSecondes(),
                u.getId(),
                u.getRole(),
                u.isEmailVerifie()
        );
    }

    /** Fin du hash BCrypt (sel + hash) : change à chaque nouveau mot de passe. */
    private static String empreinte(String hash) {
        return hash.substring(Math.max(0, hash.length() - 16));
    }
}
