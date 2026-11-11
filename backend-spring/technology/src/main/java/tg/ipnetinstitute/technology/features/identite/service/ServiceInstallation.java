package tg.ipnetinstitute.technology.features.identite.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tg.ipnetinstitute.technology.common.exception.EmailDejaUtiliseException;
import tg.ipnetinstitute.technology.common.exception.TelephoneDejaUtiliseException;
import tg.ipnetinstitute.technology.common.validation.email.ValidateurEmail;
import tg.ipnetinstitute.technology.common.validation.telephone.UsageTelephone;
import tg.ipnetinstitute.technology.common.validation.telephone.ValidateurTelephone;
import tg.ipnetinstitute.technology.features.identite.model.Role;
import tg.ipnetinstitute.technology.features.identite.model.TypeProfil;
import tg.ipnetinstitute.technology.features.identite.model.Utilisateur;
import tg.ipnetinstitute.technology.features.identite.repository.UtilisateurRepository;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.SecureRandom;

/**
 * Première installation : tant qu'aucun administrateur n'existe, un code d'installation à usage unique
 * est généré au démarrage (affiché dans la console et écrit dans code-installation.txt). Il est exigé
 * par la page /installation pour créer le compte administrateur — personne d'autre ne peut s'en emparer.
 * Variante sans interface : ADMIN_EMAIL, ADMIN_TELEPHONE et ADMIN_PASSWORD dans le fichier .env.
 */
@Service
@Order(1)
public class ServiceInstallation implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ServiceInstallation.class);
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans caractères ambigus
    private static final Path FICHIER_CODE = Path.of("code-installation.txt");

    private final UtilisateurRepository utilisateurs;
    private final PasswordEncoder passwordEncoder;
    private final ValidateurEmail validateurEmail;
    private final ValidateurTelephone validateurTelephone;
    private final ServiceVerificationEmail serviceVerificationEmail;
    private final ApplicationEventPublisher publieur;
    private final String emailEnv;
    private final String telephoneEnv;
    private final String motDePasseEnv;
    private final SecureRandom random = new SecureRandom();

    private volatile String codeInstallation;

    public ServiceInstallation(UtilisateurRepository utilisateurs, PasswordEncoder passwordEncoder,
                               ValidateurEmail validateurEmail, ValidateurTelephone validateurTelephone,
                               ServiceVerificationEmail serviceVerificationEmail, ApplicationEventPublisher publieur,
                               @Value("${app.admin.email:}") String emailEnv,
                               @Value("${app.admin.telephone:}") String telephoneEnv,
                               @Value("${app.admin.mot-de-passe:}") String motDePasseEnv) {
        this.utilisateurs = utilisateurs;
        this.passwordEncoder = passwordEncoder;
        this.validateurEmail = validateurEmail;
        this.validateurTelephone = validateurTelephone;
        this.serviceVerificationEmail = serviceVerificationEmail;
        this.publieur = publieur;
        this.emailEnv = emailEnv;
        this.telephoneEnv = telephoneEnv;
        this.motDePasseEnv = motDePasseEnv;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!installationRequise()) {
            supprimerFichierCode();
            return;
        }
        if (!emailEnv.isBlank() && !telephoneEnv.isBlank() && !motDePasseEnv.isBlank()) {
            try {
                Long id = creerAdministrateur(emailEnv, telephoneEnv, motDePasseEnv);
                log.info("Administrateur créé depuis la configuration (.env) : il confirmera son e-mail à la première connexion.");
                publieur.publishEvent(new AdministrateurCreeEvent(id));
                return;
            } catch (RuntimeException e) {
                log.error("ADMIN_* invalide dans la configuration : {}. Utilisez la page d'installation.", e.getMessage());
            }
        }
        genererCode();
    }

    public boolean installationRequise() {
        return !utilisateurs.existsByRole(Role.ADMIN);
    }

    /** Crée le premier administrateur ; renvoie son identifiant. */
    @Transactional
    public synchronized Long installer(String code, String email, String telephone, String motDePasse) {
        if (!installationRequise()) {
            throw new IllegalStateException("La plateforme est déjà installée.");
        }
        String attendu = codeInstallation;
        if (attendu == null || code == null || !MessageDigest.isEqual(
                attendu.getBytes(StandardCharsets.UTF_8), code.toUpperCase().replaceAll("[^A-Z0-9]", "").getBytes(StandardCharsets.UTF_8))) {
            throw new IllegalArgumentException("Code d'installation incorrect. Il est affiché dans la console du serveur et dans le fichier code-installation.txt.");
        }
        Long id = creerAdministrateur(email, telephone, motDePasse);
        serviceVerificationEmail.envoyerCode(id);
        codeInstallation = null;
        supprimerFichierCode();
        publieur.publishEvent(new AdministrateurCreeEvent(id));
        return id;
    }

    private Long creerAdministrateur(String emailSaisi, String telephoneSaisi, String motDePasse) {
        if (motDePasse == null || motDePasse.length() < 6) {
            throw new IllegalArgumentException("Le mot de passe doit comporter au moins 6 caractères.");
        }
        String email = validateurEmail.normaliser(emailSaisi);
        String telephone = validateurTelephone.normaliser(telephoneSaisi, UsageTelephone.COMPTE);
        if (utilisateurs.existsByEmail(email)) throw new EmailDejaUtiliseException(email);
        if (utilisateurs.existsByTelephone(telephone)) throw new TelephoneDejaUtiliseException(telephone);
        Utilisateur admin = Utilisateur.nouveau(email, telephone, passwordEncoder.encode(motDePasse), TypeProfil.AUCUN, Role.ADMIN);
        return utilisateurs.save(admin).getId();
    }

    private void genererCode() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 12; i++) sb.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
        codeInstallation = sb.toString();
        String lisible = codeInstallation.substring(0, 4) + "-" + codeInstallation.substring(4, 8) + "-" + codeInstallation.substring(8);
        try {
            Files.writeString(FICHIER_CODE, "Code d'installation IPNET Billetterie : " + lisible + System.lineSeparator()
                    + "Ouvrez la page /installation du site et saisissez ce code pour créer le compte administrateur." + System.lineSeparator());
        } catch (IOException e) {
            log.warn("Impossible d'écrire {} : {}", FICHIER_CODE.toAbsolutePath(), e.getMessage());
        }
        log.warn("""

                ================================================================
                  INSTALLATION REQUISE : aucun administrateur n'existe encore.
                  Ouvrez le site (page /installation) et saisissez le code :
                                       {}
                  (également enregistré dans {})
                ================================================================""", lisible, FICHIER_CODE.toAbsolutePath());
    }

    private void supprimerFichierCode() {
        try {
            Files.deleteIfExists(FICHIER_CODE);
        } catch (IOException ignored) {
            // fichier verrouillé : sans conséquence, le code n'est plus accepté
        }
    }
}
