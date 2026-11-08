package tg.ipnetinstitute.technology.features.identite.application;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tg.ipnetinstitute.technology.common.audit.Auditable;
import tg.ipnetinstitute.technology.common.exception.OtpInvalideException;
import tg.ipnetinstitute.technology.features.identite.domaine.Utilisateur;
import tg.ipnetinstitute.technology.features.identite.domaine.VerificationOtp;
import tg.ipnetinstitute.technology.features.identite.infrastructure.UtilisateurRepository;
import tg.ipnetinstitute.technology.features.identite.infrastructure.VerificationOtpRepository;

import java.security.SecureRandom;
import java.time.LocalDateTime;

/**
 * Service de gestion des OTP pour le téléphone (RG-02, RG-03).
 * OTP valide 5 min, usage unique, 5 tentatives max.
 */
@Service
public class ServiceVerificationTelephone {

    private static final Logger log = LoggerFactory.getLogger(ServiceVerificationTelephone.class);
    private final VerificationOtpRepository otps;
    private final UtilisateurRepository utilisateurs;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom random = new SecureRandom();

    public ServiceVerificationTelephone(VerificationOtpRepository otps, UtilisateurRepository utilisateurs, PasswordEncoder passwordEncoder) {
        this.otps = otps;
        this.utilisateurs = utilisateurs;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void envoyerCode(Long utilisateurId) {
        Utilisateur u = utilisateurs.findById(utilisateurId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + utilisateurId));

        // Génération d'un code à 6 chiffres
        int codeInt = 100000 + random.nextInt(900000);
        String codeBrut = String.valueOf(codeInt);

        // Hachage du code OTP en base (protection OWASP)
        String codeHash = passwordEncoder.encode(codeBrut);

        VerificationOtp otp = VerificationOtp.creer(utilisateurId, codeHash, 5);
        otps.save(otp);

        // En V1 / sandbox : simulé dans les logs applicatifs (ou routable par email via CanalNotification)
        log.info("OTP envoyé au numéro {} pour l'utilisateur {} : [CODE SIMULÉ: {}]", u.getTelephone(), utilisateurId, codeBrut);
    }

    @Transactional
    @Auditable(action = "VERIFICATION_OTP", typeCible = "UTILISATEUR")
    public void verifier(Long utilisateurId, String code) {
        VerificationOtp otp = otps.findTopByUtilisateurIdAndConsommeFalseOrderByExpireLeDesc(utilisateurId)
                .orElseThrow(() -> new OtpInvalideException("Aucun code OTP actif pour cet utilisateur"));

        LocalDateTime now = LocalDateTime.now();

        if (otp.estExpirer(now)) {
            throw new OtpInvalideException("Le code OTP a expiré (validité 5 minutes, RG-03)");
        }

        if (otp.getTentatives() >= 5) {
            throw new OtpInvalideException("Nombre maximal de tentatives de validation dépassé (max 5, RG-03)");
        }

        otp.incrementerTentative();

        if (!passwordEncoder.matches(code, otp.getCodeHash())) {
            throw new OtpInvalideException("Code OTP incorrect");
        }

        otp.marquerConsomme();

        Utilisateur u = utilisateurs.findById(utilisateurId).orElseThrow();
        u.validerTelephone();
        utilisateurs.save(u);

        log.info("Téléphone vérifié avec succès pour l'utilisateur {}", utilisateurId);
    }
}
