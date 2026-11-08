package tg.ipnetinstitute.technology.features.identite.application;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tg.ipnetinstitute.technology.common.audit.Auditable;
import tg.ipnetinstitute.technology.common.domaine.Email;
import tg.ipnetinstitute.technology.common.domaine.Telephone;
import tg.ipnetinstitute.technology.common.exception.EmailDejaUtiliseException;
import tg.ipnetinstitute.technology.common.exception.TelephoneDejaUtiliseException;
import tg.ipnetinstitute.technology.features.identite.domaine.Role;
import tg.ipnetinstitute.technology.features.identite.domaine.Utilisateur;
import tg.ipnetinstitute.technology.features.identite.infrastructure.UtilisateurRepository;
import tg.ipnetinstitute.technology.features.participant.application.DemandeProfil;
import tg.ipnetinstitute.technology.features.participant.application.ProfilFactory;
import tg.ipnetinstitute.technology.features.participant.domaine.TypeProfil;

/**
 * Service d'inscription conforme EF-01 à EF-04, RG-01, RG-02.
 */
@Service
public class ServiceInscription {

    private final UtilisateurRepository utilisateurs;
    private final ProfilFactory profilFactory;
    private final PasswordEncoder passwordEncoder;
    private final ServiceVerificationTelephone serviceVerificationTelephone;

    public ServiceInscription(UtilisateurRepository utilisateurs,
                              ProfilFactory profilFactory,
                              PasswordEncoder passwordEncoder,
                              ServiceVerificationTelephone serviceVerificationTelephone) {
        this.utilisateurs = utilisateurs;
        this.profilFactory = profilFactory;
        this.passwordEncoder = passwordEncoder;
        this.serviceVerificationTelephone = serviceVerificationTelephone;
    }

    @Transactional
    @Auditable(action = "INSCRIPTION", typeCible = "UTILISATEUR")
    public ReponseInscription inscrire(DemandeInscription demande) {
        // Validation des Value Objects (RFC 5322 et E.164)
        Email emailValide = new Email(demande.email());
        Telephone telephoneValide = new Telephone(demande.telephone());

        if (utilisateurs.existsByEmail(emailValide.valeur())) {
            throw new EmailDejaUtiliseException(emailValide.valeur());
        }
        if (utilisateurs.existsByTelephone(telephoneValide.valeur())) {
            throw new TelephoneDejaUtiliseException(telephoneValide.valeur());
        }

        // Construction et validation du profil via le Strategy Pattern
        DemandeProfil demandeProfil = creerDemandeProfil(demande);
        var profilStrategy = profilFactory.pour(demande.typeProfil());
        profilStrategy.valider(demandeProfil);

        // Hachage sécurisé BCrypt force >= 12
        String motDePasseHash = passwordEncoder.encode(demande.motDePasse());

        // Création du compte utilisateur
        Utilisateur utilisateur = Utilisateur.nouveau(
                emailValide.valeur(),
                telephoneValide.valeur(),
                motDePasseHash,
                demande.typeProfil(),
                Role.PARTICIPANT
        );
        utilisateur = utilisateurs.save(utilisateur);

        // Enregistrement du profil spécifique
        profilStrategy.enregistrer(utilisateur.getId(), demandeProfil);

        // Déclenchement de l'envoi de l'OTP
        serviceVerificationTelephone.envoyerCode(utilisateur.getId());

        return new ReponseInscription(
                utilisateur.getId(),
                utilisateur.getEmail(),
                utilisateur.getTelephone(),
                utilisateur.getTypeProfil(),
                utilisateur.getRole(),
                "Inscription réussie. Un code OTP a été envoyé pour vérifier votre numéro de téléphone."
        );
    }

    private DemandeProfil creerDemandeProfil(DemandeInscription demande) {
        if (demande.typeProfil() == TypeProfil.ETUDIANT) {
            return new DemandeProfil.DemandeEtudiant(
                    demande.nom(),
                    demande.prenom(),
                    demande.adresse(),
                    demande.filiereId(),
                    demande.anneeInscriptionL1()
            );
        } else if (demande.typeProfil() == TypeProfil.VISITEUR) {
            return new DemandeProfil.DemandeVisiteur(
                    demande.nom(),
                    demande.prenom(),
                    demande.adresse(),
                    demande.categorieId(),
                    demande.organisation()
            );
        }
        throw new IllegalArgumentException("Type de profil invalide pour inscription");
    }
}
