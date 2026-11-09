package tg.ipnetinstitute.technology.features.identite.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tg.ipnetinstitute.technology.common.exception.EmailDejaUtiliseException;
import tg.ipnetinstitute.technology.common.exception.OtpInvalideException;
import tg.ipnetinstitute.technology.common.exception.TelephoneDejaUtiliseException;
import tg.ipnetinstitute.technology.common.validation.email.ValidateurEmail;
import tg.ipnetinstitute.technology.common.validation.telephone.UsageTelephone;
import tg.ipnetinstitute.technology.common.validation.telephone.ValidateurTelephone;
import tg.ipnetinstitute.technology.config.Auditable;
import tg.ipnetinstitute.technology.features.identite.dto.request.DemandeInscription;
import tg.ipnetinstitute.technology.features.identite.dto.request.DemandeProfil;
import tg.ipnetinstitute.technology.features.identite.dto.response.ReponseInscription;
import tg.ipnetinstitute.technology.features.identite.model.InscriptionEnAttente;
import tg.ipnetinstitute.technology.features.identite.model.Role;
import tg.ipnetinstitute.technology.features.identite.model.TypeProfil;
import tg.ipnetinstitute.technology.features.identite.model.Utilisateur;
import tg.ipnetinstitute.technology.features.identite.repository.InscriptionEnAttenteRepository;
import tg.ipnetinstitute.technology.features.identite.repository.UtilisateurRepository;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Inscription en deux temps (EF-01 à EF-05, RG-01 à RG-03) :
 * <ol>
 *   <li>{@link #demander} valide les données, les met en attente et envoie un code à l'adresse e-mail ;
 *       aucun compte n'est créé à ce stade ;</li>
 *   <li>{@link #confirmer} crée le compte (déjà vérifié) uniquement si le code saisi est correct.</li>
 * </ol>
 * Un faux e-mail ne produit donc jamais de compte, ni d'accès aux tableaux de bord et aux pages protégées.
 */
@Service
public class ServiceInscription {

    private static final Logger log = LoggerFactory.getLogger(ServiceInscription.class);
    private static final int VALIDITE_CODE_MINUTES = 5;      // RG-03
    private static final int DELAI_RENVOI_SECONDES = 30;
    private static final int PEREMPTION_HEURES = 24;

    private final UtilisateurRepository utilisateurs;
    private final InscriptionEnAttenteRepository enAttente;
    private final ProfilFactory profilFactory;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher publieur;
    private final ValidateurEmail validateurEmail;
    private final ValidateurTelephone validateurTelephone;
    private final SecureRandom random = new SecureRandom();

    public ServiceInscription(UtilisateurRepository utilisateurs,
                              InscriptionEnAttenteRepository enAttente,
                              ProfilFactory profilFactory,
                              PasswordEncoder passwordEncoder,
                              ApplicationEventPublisher publieur,
                              ValidateurEmail validateurEmail,
                              ValidateurTelephone validateurTelephone) {
        this.utilisateurs = utilisateurs;
        this.enAttente = enAttente;
        this.profilFactory = profilFactory;
        this.passwordEncoder = passwordEncoder;
        this.publieur = publieur;
        this.validateurEmail = validateurEmail;
        this.validateurTelephone = validateurTelephone;
    }

    /** Étape 1 : contrôle des données, mise en attente et envoi du code. Aucun compte n'est créé. */
    @Transactional
    public ReponseInscription demander(DemandeInscription demande) {
        // RG-01 / RG-02 : validation par les règles déclarées (syntaxe, domaine, plan de numérotation, type de ligne)
        String email = validateurEmail.normaliser(demande.email());
        String telephone = validateurTelephone.normaliser(demande.telephone(), UsageTelephone.COMPTE);

        if (utilisateurs.existsByEmail(email)) {
            throw new EmailDejaUtiliseException(email);
        }
        if (utilisateurs.existsByTelephone(telephone)) {
            throw new TelephoneDejaUtiliseException(telephone);
        }

        // Validation métier du profil (filière / catégorie / année) par la stratégie du type de profil
        DemandeProfil demandeProfil = creerDemandeProfil(demande);
        profilFactory.pour(demande.typeProfil()).valider(demandeProfil);

        InscriptionEnAttente nouvelle = InscriptionEnAttente.creer(
                email, telephone, passwordEncoder.encode(demande.motDePasse()), demande.typeProfil(),
                demande.nom().trim(), demande.prenom().trim(),
                demande.filiereId(), demande.anneeInscriptionL1(), demande.categorieId(),
                demande.organisation() == null || demande.organisation().isBlank() ? null : demande.organisation().trim());

        // Une nouvelle demande pour la même adresse remplace la précédente (non validée)
        InscriptionEnAttente attente = enAttente.findByEmail(email).map(existante -> {
            existante.remplacerPar(nouvelle);
            return existante;
        }).orElse(nouvelle);
        emettreCode(attente);

        return new ReponseInscription(email, VALIDITE_CODE_MINUTES,
                "Un code de vérification a été envoyé à " + email + ". Saisissez-le pour créer votre compte.");
    }

    /** Renvoi d'un nouveau code pour une inscription en attente (délai minimal entre deux envois). */
    @Transactional
    public ReponseInscription renvoyer(String emailSaisi) {
        String email = validateurEmail.normaliser(emailSaisi);
        InscriptionEnAttente attente = enAttente.findByEmail(email)
                .orElseThrow(() -> new OtpInvalideException("Aucune inscription en cours pour cette adresse : recommencez l'inscription."));
        if (Duration.between(attente.getDernierEnvoiLe(), LocalDateTime.now()).getSeconds() < DELAI_RENVOI_SECONDES) {
            throw new IllegalStateException("Patientez quelques secondes avant de demander un nouveau code.");
        }
        emettreCode(attente);
        return new ReponseInscription(email, VALIDITE_CODE_MINUTES, "Un nouveau code a été envoyé à " + email + ".");
    }

    /**
     * Étape 2 : le code est correct, le compte et son profil sont créés (adresse e-mail déjà vérifiée).
     * Les essais échoués sont comptés même si la transaction lève l'exception (RG-03).
     *
     * @return l'identifiant du compte créé
     */
    @Transactional(noRollbackFor = OtpInvalideException.class)
    @Auditable(action = "INSCRIPTION", typeCible = "UTILISATEUR")
    public Long confirmer(String emailSaisi, String code) {
        String email = validateurEmail.normaliser(emailSaisi);
        InscriptionEnAttente attente = enAttente.findByEmail(email)
                .orElseThrow(() -> new OtpInvalideException("Aucune inscription en cours pour cette adresse : recommencez l'inscription."));

        if (attente.codeExpire(LocalDateTime.now())) {
            throw new OtpInvalideException("Le code a expiré (validité " + VALIDITE_CODE_MINUTES + " minutes) : demandez un nouveau code.");
        }
        if (attente.essaisEpuises()) {
            throw new OtpInvalideException("Nombre maximal d'essais atteint : demandez un nouveau code.");
        }
        attente.incrementerTentative();
        enAttente.save(attente);
        if (code == null || !passwordEncoder.matches(code, attente.getCodeHash())) {
            int restants = InscriptionEnAttente.ESSAIS_MAX - attente.getTentatives();
            throw new OtpInvalideException("Code incorrect" + (restants > 0 ? " (" + restants + " essai(s) restant(s))." : "."));
        }

        // Le code est bon : dernières vérifications d'unicité (un autre compte a pu se créer entre-temps)
        if (utilisateurs.existsByEmail(email)) {
            enAttente.delete(attente);
            throw new EmailDejaUtiliseException(email);
        }
        if (utilisateurs.existsByTelephone(attente.getTelephone())) {
            enAttente.delete(attente);
            throw new TelephoneDejaUtiliseException(attente.getTelephone());
        }

        Utilisateur utilisateur = Utilisateur.nouveau(email, attente.getTelephone(), attente.getMotDePasseHash(),
                attente.getTypeProfil(), Role.PARTICIPANT);
        utilisateur.validerEmail();
        utilisateur = utilisateurs.save(utilisateur);

        var profil = profilFactory.pour(attente.getTypeProfil());
        profil.enregistrer(utilisateur.getId(), versDemandeProfil(attente));

        enAttente.delete(attente);
        log.info("Compte créé après vérification de l'e-mail pour l'utilisateur {}", utilisateur.getId());
        return utilisateur.getId();
    }

    /** Purge des demandes jamais confirmées. */
    @Scheduled(cron = "0 30 * * * *")
    @Transactional
    public void purgerInscriptionsPerimees() {
        int n = enAttente.supprimerAnterieuresA(LocalDateTime.now().minusHours(PEREMPTION_HEURES));
        if (n > 0) {
            log.info("{} inscription(s) non confirmée(s) purgée(s)", n);
        }
    }

    private void emettreCode(InscriptionEnAttente attente) {
        String code = String.valueOf(100_000 + random.nextInt(900_000));
        attente.nouveauCode(passwordEncoder.encode(code), VALIDITE_CODE_MINUTES);
        enAttente.save(attente);
        // Acheminé par la feature notification (outbox) ; le code en clair n'est jamais journalisé
        publieur.publishEvent(new OtpGenereEvent(null, attente.getEmail(), code));
    }

    private DemandeProfil creerDemandeProfil(DemandeInscription demande) {
        if (demande.typeProfil() == TypeProfil.ETUDIANT) {
            return new DemandeProfil.DemandeEtudiant(demande.nom(), demande.prenom(),
                    demande.filiereId(), demande.anneeInscriptionL1());
        } else if (demande.typeProfil() == TypeProfil.VISITEUR) {
            return new DemandeProfil.DemandeVisiteur(demande.nom(), demande.prenom(),
                    demande.categorieId(), demande.organisation());
        }
        throw new IllegalArgumentException("Type de profil invalide pour inscription");
    }

    private DemandeProfil versDemandeProfil(InscriptionEnAttente a) {
        return a.getTypeProfil() == TypeProfil.ETUDIANT
                ? new DemandeProfil.DemandeEtudiant(a.getNom(), a.getPrenom(), a.getFiliereId(), a.getAnneeInscriptionL1())
                : new DemandeProfil.DemandeVisiteur(a.getNom(), a.getPrenom(), a.getCategorieId(), a.getOrganisation());
    }
}
