package tg.ipnetinstitute.technology.features.identite.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tg.ipnetinstitute.technology.common.exception.RessourceIntrouvableException;
import tg.ipnetinstitute.technology.common.exception.TelephoneDejaUtiliseException;
import tg.ipnetinstitute.technology.common.validation.telephone.UsageTelephone;
import tg.ipnetinstitute.technology.common.validation.telephone.ValidateurTelephone;
import tg.ipnetinstitute.technology.config.Auditable;
import tg.ipnetinstitute.technology.features.identite.dto.request.ModificationProfilRequest;
import tg.ipnetinstitute.technology.features.identite.dto.response.ProfilResponse;
import tg.ipnetinstitute.technology.features.identite.dto.response.ResumePersonne;
import tg.ipnetinstitute.technology.features.identite.model.Etudiant;
import tg.ipnetinstitute.technology.features.identite.model.TypeProfil;
import tg.ipnetinstitute.technology.features.identite.model.Utilisateur;
import tg.ipnetinstitute.technology.features.identite.model.Visiteur;
import tg.ipnetinstitute.technology.features.identite.repository.EtudiantRepository;
import tg.ipnetinstitute.technology.features.identite.repository.UtilisateurRepository;
import tg.ipnetinstitute.technology.features.identite.repository.VisiteurRepository;

import java.time.Year;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Interface publique de la feature identite pour les autres features (billet, controle, admin)
 * et cas d'usage du profil courant (EF-08, suppression de compte §5.2).
 */
@Service
public class ServiceIdentite {

    /** Coordonnées d'un participant, utilisables par les autres features. */
    public record Coordonnees(Long utilisateurId, String nom, String prenom, String detail,
                              String email, String telephone, TypeProfil typeProfil) {}

    private final UtilisateurRepository utilisateurs;
    private final EtudiantRepository etudiants;
    private final VisiteurRepository visiteurs;
    private final PasswordEncoder passwordEncoder;
    private final ValidateurTelephone validateurTelephone;

    public ServiceIdentite(UtilisateurRepository utilisateurs,
                           EtudiantRepository etudiants,
                           VisiteurRepository visiteurs,
                           PasswordEncoder passwordEncoder,
                           ValidateurTelephone validateurTelephone) {
        this.utilisateurs = utilisateurs;
        this.etudiants = etudiants;
        this.visiteurs = visiteurs;
        this.passwordEncoder = passwordEncoder;
        this.validateurTelephone = validateurTelephone;
    }

    /** Nom, prénom et profil (filière / catégorie) selon le type de profil réel de l'utilisateur (billet, scan). */
    @Transactional(readOnly = true)
    public ResumePersonne resumer(Long utilisateurId) {
        Coordonnees c = coordonnees(utilisateurId);
        return new ResumePersonne(c.nom(), c.prenom(), c.detail());
    }

    @Transactional(readOnly = true)
    public Coordonnees coordonnees(Long utilisateurId) {
        Utilisateur u = utilisateurs.findById(utilisateurId)
                .orElseThrow(() -> new RessourceIntrouvableException("Utilisateur", utilisateurId));
        String nom = "—", prenom = "—", detail = "—";
        if (u.getTypeProfil() == TypeProfil.ETUDIANT) {
            Optional<Etudiant> e = etudiants.findById(utilisateurId);
            if (e.isPresent()) { nom = e.get().getNom(); prenom = e.get().getPrenom(); detail = e.get().getFiliere().getLibelle(); }
        } else if (u.getTypeProfil() == TypeProfil.VISITEUR) {
            Optional<Visiteur> v = visiteurs.findById(utilisateurId);
            if (v.isPresent()) { nom = v.get().getNom(); prenom = v.get().getPrenom(); detail = detailVisiteur(v.get()); }
        }
        return new Coordonnees(u.getId(), nom, prenom, detail, u.getEmail(), u.getTelephone(), u.getTypeProfil());
    }

    /** Identifiant d'un administrateur actif (le plus ancien), pour les traitements d'initialisation. */
    @Transactional(readOnly = true)
    public Optional<Long> premierAdministrateurActif() {
        List<Utilisateur> admins = utilisateurs.findByRoleOrderByCreeLeDesc(tg.ipnetinstitute.technology.features.identite.model.Role.ADMIN);
        return admins.stream().filter(Utilisateur::isActif).reduce((premier, suivant) -> suivant).map(Utilisateur::getId);
    }

    @Transactional(readOnly = true)
    public Optional<String> emailDe(Long utilisateurId) {
        return utilisateurId == null ? Optional.empty() : utilisateurs.findById(utilisateurId).map(Utilisateur::getEmail);
    }

    /** GET /api/profil/moi */
    @Transactional(readOnly = true)
    public ProfilResponse profil(Long utilisateurId) {
        Utilisateur u = utilisateurs.findById(utilisateurId)
                .orElseThrow(() -> new RessourceIntrouvableException("Utilisateur", utilisateurId));

        String nom = null, prenom = null;
        ProfilResponse.ProfilEtudiantResponse pe = null;
        ProfilResponse.ProfilVisiteurResponse pv = null;

        if (u.getTypeProfil() == TypeProfil.ETUDIANT) {
            Etudiant e = etudiants.findById(utilisateurId).orElse(null);
            if (e != null) {
                nom = e.getNom(); prenom = e.getPrenom();
                pe = new ProfilResponse.ProfilEtudiantResponse(
                        e.getFiliere().getId(), e.getFiliere().getLibelle(),
                        e.getAnneeInscriptionL1(), e.filiereModifiable(Year.now().getValue()));
            }
        } else if (u.getTypeProfil() == TypeProfil.VISITEUR) {
            Visiteur v = visiteurs.findById(utilisateurId).orElse(null);
            if (v != null) {
                nom = v.getNom(); prenom = v.getPrenom();
                pv = new ProfilResponse.ProfilVisiteurResponse(
                        v.getCategorie().getId(), v.getCategorie().getCode(),
                        v.getCategorie().getLibelle(), v.getOrganisation());
            }
        }

        return new ProfilResponse(u.getId(), u.getEmail(), u.isEmailVerifie(), u.getTelephone(),
                u.getRole(), u.getTypeProfil(), nom, prenom, u.getCreeLe(), pe, pv);
    }

    /** EF-08 : modification du profil (hors type et e-mail). */
    @Transactional
    @Auditable(action = "MODIFICATION_PROFIL", typeCible = "UTILISATEUR")
    public ProfilResponse modifierProfil(Long utilisateurId, ModificationProfilRequest demande) {
        Utilisateur u = utilisateurs.findById(utilisateurId)
                .orElseThrow(() -> new RessourceIntrouvableException("Utilisateur", utilisateurId));

        String telephone = validateurTelephone.normaliser(demande.telephone(), UsageTelephone.COMPTE);
        boolean telephoneChange = !telephone.equals(u.getTelephone());
        if (telephoneChange && utilisateurs.existsByTelephone(telephone)) {
            throw new TelephoneDejaUtiliseException(telephone);
        }

        if (u.getTypeProfil() != TypeProfil.AUCUN
                && (vide(demande.nom()) || vide(demande.prenom()))) {
            throw new IllegalArgumentException("Nom et prénom sont obligatoires.");
        }
        if (u.getTypeProfil() == TypeProfil.ETUDIANT) {
            Etudiant e = etudiants.findById(utilisateurId)
                    .orElseThrow(() -> new RessourceIntrouvableException("Profil étudiant", utilisateurId));
            e.modifierCoordonnees(demande.nom(), demande.prenom());
            etudiants.save(e);
        } else if (u.getTypeProfil() == TypeProfil.VISITEUR) {
            Visiteur v = visiteurs.findById(utilisateurId)
                    .orElseThrow(() -> new RessourceIntrouvableException("Profil visiteur", utilisateurId));
            v.modifierCoordonnees(demande.nom(), demande.prenom(), demande.organisation());
            visiteurs.save(v);
        }

        u.changerTelephone(telephone);
        utilisateurs.save(u);
        return profil(utilisateurId);
    }

    private static String detailVisiteur(Visiteur v) {
        String base = v.getCategorie().getLibelle();
        return v.getOrganisation() == null || v.getOrganisation().isBlank() ? base : base + " — " + v.getOrganisation();
    }

    private static boolean vide(String s) {
        return s == null || s.isBlank();
    }

    /** Suppression du compte (§5.2) : anonymisation après confirmation du mot de passe. */
    @Transactional
    @Auditable(action = "SUPPRESSION_COMPTE", typeCible = "UTILISATEUR")
    public void supprimerCompte(Long utilisateurId, String motDePasse) {
        Utilisateur u = utilisateurs.findById(utilisateurId)
                .orElseThrow(() -> new RessourceIntrouvableException("Utilisateur", utilisateurId));
        if (!passwordEncoder.matches(motDePasse, u.getMotDePasseHash())) {
            throw new IllegalArgumentException("Mot de passe incorrect");
        }
        etudiants.findById(utilisateurId).ifPresent(e -> {
            e.modifierCoordonnees("Compte supprimé", "-");
            etudiants.save(e);
        });
        visiteurs.findById(utilisateurId).ifPresent(v -> {
            v.modifierCoordonnees("Compte supprimé", "-", null);
            visiteurs.save(v);
        });
        u.anonymiser(passwordEncoder.encode(UUID.randomUUID().toString()));
        utilisateurs.save(u);
    }
}
