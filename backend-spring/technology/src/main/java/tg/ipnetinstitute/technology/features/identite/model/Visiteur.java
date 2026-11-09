package tg.ipnetinstitute.technology.features.identite.model;

import jakarta.persistence.*;

/**
 * Profil Visiteur (relation 1-1 avec Utilisateur via @MapsId).
 * Respect de RG-05.
 */
@Entity
@Table(name = "visiteur")
public class Visiteur {

    @Id
    @Column(name = "utilisateur_id")
    private Long id;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(nullable = false, length = 100)
    private String prenom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categorie_id", nullable = false)
    private CategorieVisiteur categorie;

    @Column(length = 150)
    private String organisation;

    protected Visiteur() {}

    public static Visiteur creer(Long utilisateurId, String nom, String prenom, CategorieVisiteur categorie, String organisation) {
        Visiteur v = new Visiteur();
        v.id = utilisateurId;
        v.nom = nom;
        v.prenom = prenom;
        v.categorie = categorie;
        v.organisation = organisation;
        return v;
    }

    /** EF-08 : modification des informations de profil. */
    public void modifierCoordonnees(String nom, String prenom, String organisation) {
        this.nom = nom;
        this.prenom = prenom;
        this.organisation = organisation;
    }

    public Long getId() { return id; }
    public String getNom() { return nom; }
    public String getPrenom() { return prenom; }
    public CategorieVisiteur getCategorie() { return categorie; }
    public String getOrganisation() { return organisation; }
}
