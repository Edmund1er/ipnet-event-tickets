package tg.ipnetinstitute.technology.features.participant.domaine;

import jakarta.persistence.*;

/**
 * Profil Étudiant (relation 1-1 avec Utilisateur via @MapsId).
 * Respect de RG-04.
 */
@Entity
@Table(name = "etudiant")
public class Etudiant {

    @Id
    @Column(name = "utilisateur_id")
    private Long id;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(nullable = false, length = 100)
    private String prenom;

    @Column(nullable = false, length = 255)
    private String adresse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "filiere_id", nullable = false)
    private Filiere filiere;

    @Column(name = "annee_inscription_l1", nullable = false)
    private short anneeInscriptionL1;

    @Column(name = "filiere_verrouillee", nullable = false)
    private boolean filiereVerrouillee = false;

    protected Etudiant() {}

    public static Etudiant creer(Long utilisateurId, String nom, String prenom, String adresse, Filiere filiere, short anneeInscriptionL1, int anneeCourante) {
        Etudiant e = new Etudiant();
        e.id = utilisateurId;
        e.nom = nom;
        e.prenom = prenom;
        e.adresse = adresse;
        e.filiere = filiere;
        e.anneeInscriptionL1 = anneeInscriptionL1;
        // RG-04 : passe à TRUE dès que (année courante − année inscription L1) > 1
        e.filiereVerrouillee = (anneeCourante - anneeInscriptionL1) > 1;
        return e;
    }

    public void changerFiliere(Filiere nouvelleFiliere, int anneeCourante) {
        if (filiereVerrouillee || (anneeCourante - anneeInscriptionL1) > 1) {
            throw new IllegalStateException("La filière est verrouillée et ne peut plus être modifiée (RG-04).");
        }
        this.filiere = nouvelleFiliere;
    }

    public Long getId() { return id; }
    public String getNom() { return nom; }
    public String getPrenom() { return prenom; }
    public String getAdresse() { return adresse; }
    public Filiere getFiliere() { return filiere; }
    public short getAnneeInscriptionL1() { return anneeInscriptionL1; }
    public boolean isFiliereVerrouillee() { return filiereVerrouillee; }
}
