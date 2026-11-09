package tg.ipnetinstitute.technology.features.identite.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Inscription en attente de validation du code e-mail (RG-01, RG-03).
 * Aucun compte utilisateur n'existe tant que le code n'a pas été validé : un faux e-mail
 * ne produit donc jamais de compte, ni d'accès aux tableaux de bord ou aux pages protégées.
 */
@Entity
@Table(name = "inscription_en_attente")
public class InscriptionEnAttente {

    public static final int ESSAIS_MAX = 5;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false, length = 20)
    private String telephone;

    @Column(name = "mot_de_passe_hash", nullable = false, length = 100)
    private String motDePasseHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_profil", nullable = false, length = 20)
    private TypeProfil typeProfil;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(nullable = false, length = 100)
    private String prenom;

    @Column(name = "filiere_id")
    private Long filiereId;

    @Column(name = "annee_inscription_l1")
    private Short anneeInscriptionL1;

    @Column(name = "categorie_id")
    private Long categorieId;

    @Column(length = 150)
    private String organisation;

    @Column(name = "code_hash", nullable = false, length = 100)
    private String codeHash;

    @Column(name = "expire_le", nullable = false)
    private LocalDateTime expireLe;

    @Column(nullable = false)
    private short tentatives = 0;

    @Column(name = "cree_le", nullable = false, updatable = false)
    private LocalDateTime creeLe;

    @Column(name = "dernier_envoi_le", nullable = false)
    private LocalDateTime dernierEnvoiLe;

    protected InscriptionEnAttente() {}

    public static InscriptionEnAttente creer(String email, String telephone, String motDePasseHash, TypeProfil typeProfil,
                                             String nom, String prenom, Long filiereId, Integer anneeInscriptionL1,
                                             Long categorieId, String organisation) {
        InscriptionEnAttente i = new InscriptionEnAttente();
        i.email = email;
        i.telephone = telephone;
        i.motDePasseHash = motDePasseHash;
        i.typeProfil = typeProfil;
        i.nom = nom;
        i.prenom = prenom;
        i.filiereId = filiereId;
        i.anneeInscriptionL1 = anneeInscriptionL1 == null ? null : anneeInscriptionL1.shortValue();
        i.categorieId = categorieId;
        i.organisation = organisation;
        i.creeLe = LocalDateTime.now();
        return i;
    }

    /** Remplace les données d'une demande précédente non validée pour la même adresse. */
    public void remplacerPar(InscriptionEnAttente autre) {
        this.telephone = autre.telephone;
        this.motDePasseHash = autre.motDePasseHash;
        this.typeProfil = autre.typeProfil;
        this.nom = autre.nom;
        this.prenom = autre.prenom;
        this.filiereId = autre.filiereId;
        this.anneeInscriptionL1 = autre.anneeInscriptionL1;
        this.categorieId = autre.categorieId;
        this.organisation = autre.organisation;
    }

    /** Nouveau code (RG-03) : valable {@code dureeMinutes}, compteur d'essais remis à zéro. */
    public void nouveauCode(String codeHash, int dureeMinutes) {
        this.codeHash = codeHash;
        this.expireLe = LocalDateTime.now().plusMinutes(dureeMinutes);
        this.tentatives = 0;
        this.dernierEnvoiLe = LocalDateTime.now();
    }

    public boolean codeExpire(LocalDateTime now) { return now.isAfter(expireLe); }
    public boolean essaisEpuises() { return tentatives >= ESSAIS_MAX; }
    public void incrementerTentative() { this.tentatives++; }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getTelephone() { return telephone; }
    public String getMotDePasseHash() { return motDePasseHash; }
    public TypeProfil getTypeProfil() { return typeProfil; }
    public String getNom() { return nom; }
    public String getPrenom() { return prenom; }
    public Long getFiliereId() { return filiereId; }
    public Integer getAnneeInscriptionL1() { return anneeInscriptionL1 == null ? null : anneeInscriptionL1.intValue(); }
    public Long getCategorieId() { return categorieId; }
    public String getOrganisation() { return organisation; }
    public String getCodeHash() { return codeHash; }
    public LocalDateTime getExpireLe() { return expireLe; }
    public short getTentatives() { return tentatives; }
    public LocalDateTime getCreeLe() { return creeLe; }
    public LocalDateTime getDernierEnvoiLe() { return dernierEnvoiLe; }
}
