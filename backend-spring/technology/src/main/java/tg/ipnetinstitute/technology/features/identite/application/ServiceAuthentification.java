package tg.ipnetinstitute.technology.features.identite.application;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tg.ipnetinstitute.technology.common.audit.Auditable;
import tg.ipnetinstitute.technology.common.domaine.Email;
import tg.ipnetinstitute.technology.common.exception.CompteInactifException;
import tg.ipnetinstitute.technology.common.security.JwtProvider;
import tg.ipnetinstitute.technology.features.identite.domaine.Utilisateur;
import tg.ipnetinstitute.technology.features.identite.infrastructure.UtilisateurRepository;

import java.time.LocalDateTime;

/**
 * Service d'authentification conforme Section 5.1 et RG-18.
 * Limitation à 5 échecs consécutifs avant verrouillage temporaire de 15 minutes.
 */
@Service
public class ServiceAuthentification {

    private final UtilisateurRepository utilisateurs;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    public ServiceAuthentification(UtilisateurRepository utilisateurs, PasswordEncoder passwordEncoder, JwtProvider jwtProvider) {
        this.utilisateurs = utilisateurs;
        this.passwordEncoder = passwordEncoder;
        this.jwtProvider = jwtProvider;
    }

    @Transactional
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

        // Réinitialiser les tentatives d'échec
        u.reinitialiserTentatives();
        utilisateurs.save(u);

        String accessToken = jwtProvider.genererAccessToken(u.getId(), u.getEmail(), u.getRole());
        String refreshToken = jwtProvider.genererRefreshToken(u.getId());

        return new TokensAcces(accessToken, refreshToken, 900); // 15 min
    }

    @Transactional
    public TokensAcces rafraichir(String refreshToken) {
        if (!jwtProvider.validerToken(refreshToken)) {
            throw new BadCredentialsException("Jeton de rafraîchissement invalide ou expiré");
        }

        Long userId = jwtProvider.extraireUtilisateurId(refreshToken);
        Utilisateur u = utilisateurs.findById(userId)
                .orElseThrow(() -> new BadCredentialsException("Utilisateur non trouvé"));

        if (!u.isActif()) {
            throw new CompteInactifException(u.getId());
        }

        // Rotation stricte des tokens
        String nouveauAccessToken = jwtProvider.genererAccessToken(u.getId(), u.getEmail(), u.getRole());
        String nouveauRefreshToken = jwtProvider.genererRefreshToken(u.getId());

        return new TokensAcces(nouveauAccessToken, nouveauRefreshToken, 900);
    }
}
