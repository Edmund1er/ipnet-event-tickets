package tg.ipnetinstitute.technology.features.identite.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tg.ipnetinstitute.technology.common.exception.EmailDejaUtiliseException;
import tg.ipnetinstitute.technology.common.exception.OtpInvalideException;
import tg.ipnetinstitute.technology.common.exception.RessourceIntrouvableException;
import tg.ipnetinstitute.technology.common.validation.email.ValidateurEmail;
import tg.ipnetinstitute.technology.config.Auditable;
import tg.ipnetinstitute.technology.features.identite.model.ObjetOtp;
import tg.ipnetinstitute.technology.features.identite.model.Utilisateur;
import tg.ipnetinstitute.technology.features.identite.model.VerificationOtp;
import tg.ipnetinstitute.technology.features.identite.repository.UtilisateurRepository;
import tg.ipnetinstitute.technology.features.identite.repository.VerificationOtpRepository;

import java.security.SecureRandom;
import java.time.LocalDateTime;

/**
 * Vérification des adresses e-mail par code à usage unique (RG-01, RG-03, RG-20, EF-08).
 * Code de 6 chiffres, valable 5 minutes, 5 essais maximum, stocké haché (BCrypt), jamais journalisé.
 */
@Service
public class ServiceVerificationEmail {

    private static final Logger log = LoggerFactory.getLogger(ServiceVerificationEmail.class);
    private static final int VALIDITE_MINUTES = 5;
    private static final int ESSAIS_MAX = 5;

    private final VerificationOtpRepository otps;
    private final UtilisateurRepository utilisateurs;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher publieur;
    private final ValidateurEmail validateurEmail;
    private final SecureRandom random = new SecureRandom();

    public ServiceVerificationEmail(VerificationOtpRepository otps, UtilisateurRepository utilisateurs,
                                    PasswordEncoder passwordEncoder, ApplicationEventPublisher publieur,
                                    ValidateurEmail validateurEmail) {
        this.otps = otps;
        this.utilisateurs = utilisateurs;
        this.passwordEncoder = passwordEncoder;
        this.publieur = publieur;
        this.validateurEmail = validateurEmail;
    }

    /** Envoie un code de confirmation à l'adresse actuelle du compte. */
    @Transactional
    public void envoyerCode(Long utilisateurId) {
        Utilisateur u = charger(utilisateurId);
        if (u.isEmailVerifie()) {
            throw new IllegalStateException("Votre adresse e-mail est déjà vérifiée.");
        }
        emettre(u.getId(), ObjetOtp.VERIFICATION_EMAIL, u.getEmail());
    }

    /** Confirme l'adresse actuelle avec le code reçu. */
    @Transactional(noRollbackFor = OtpInvalideException.class) // RG-03 : les essais échoués sont comptés
    @Auditable(action = "VERIFICATION_EMAIL", typeCible = "UTILISATEUR")
    public void verifier(Long utilisateurId, String code) {
        Utilisateur u = charger(utilisateurId);
        VerificationOtp otp = consommer(utilisateurId, ObjetOtp.VERIFICATION_EMAIL, code);
        if (!u.getEmail().equals(otp.getCible())) {
            throw new OtpInvalideException("Ce code a été envoyé à une autre adresse. Demandez un nouveau code.");
        }
        u.validerEmail();
        utilisateurs.save(u);
        log.info("Adresse e-mail vérifiée pour l'utilisateur {}", utilisateurId);
    }

    /** EF-08 : demande de changement d'adresse ; le code est envoyé à la nouvelle adresse. */
    @Transactional
    public void demanderChangement(Long utilisateurId, String nouvelleSaisie) {
        Utilisateur u = charger(utilisateurId);
        String nouvelle = validateurEmail.normaliser(nouvelleSaisie);
        if (nouvelle.equals(u.getEmail())) {
            throw new IllegalArgumentException("C'est déjà l'adresse de votre compte.");
        }
        if (utilisateurs.existsByEmail(nouvelle)) {
            throw new EmailDejaUtiliseException(nouvelle);
        }
        emettre(u.getId(), ObjetOtp.CHANGEMENT_EMAIL, nouvelle);
    }

    /** EF-08 : confirmation du changement avec le code reçu sur la nouvelle adresse. */
    @Transactional(noRollbackFor = OtpInvalideException.class)
    @Auditable(action = "CHANGEMENT_EMAIL", typeCible = "UTILISATEUR")
    public String confirmerChangement(Long utilisateurId, String code) {
        Utilisateur u = charger(utilisateurId);
        VerificationOtp otp = consommer(utilisateurId, ObjetOtp.CHANGEMENT_EMAIL, code);
        if (utilisateurs.existsByEmail(otp.getCible())) {
            throw new EmailDejaUtiliseException(otp.getCible());
        }
        u.changerEmail(otp.getCible());
        utilisateurs.save(u);
        return u.getEmail();
    }

    private void emettre(Long utilisateurId, ObjetOtp objet, String destinataire) {
        otps.invaliderCodesEnCours(utilisateurId, objet);
        String code = String.valueOf(100_000 + random.nextInt(900_000));
        otps.save(VerificationOtp.creer(utilisateurId, passwordEncoder.encode(code), VALIDITE_MINUTES, objet, destinataire));
        // Acheminement par la feature notification (outbox) ; le code en clair n'est jamais journalisé
        publieur.publishEvent(new OtpGenereEvent(utilisateurId, destinataire, code));
    }

    private VerificationOtp consommer(Long utilisateurId, ObjetOtp objet, String code) {
        VerificationOtp otp = otps.findTopByUtilisateurIdAndObjetAndConsommeFalseOrderByExpireLeDesc(utilisateurId, objet)
                .orElseThrow(() -> new OtpInvalideException("Aucun code en cours : demandez un nouveau code."));
        if (otp.estExpirer(LocalDateTime.now())) {
            throw new OtpInvalideException("Le code a expiré (validité 5 minutes) : demandez un nouveau code.");
        }
        if (otp.getTentatives() >= ESSAIS_MAX) {
            throw new OtpInvalideException("Nombre maximal d'essais atteint : demandez un nouveau code.");
        }
        otp.incrementerTentative();
        otps.save(otp);
        if (code == null || !passwordEncoder.matches(code, otp.getCodeHash())) {
            int restants = ESSAIS_MAX - otp.getTentatives();
            throw new OtpInvalideException("Code incorrect" + (restants > 0 ? " (" + restants + " essai(s) restant(s))." : "."));
        }
        otp.marquerConsomme();
        otps.save(otp);
        return otp;
    }

    private Utilisateur charger(Long id) {
        return utilisateurs.findById(id).orElseThrow(() -> new RessourceIntrouvableException("Utilisateur", id));
    }
}
