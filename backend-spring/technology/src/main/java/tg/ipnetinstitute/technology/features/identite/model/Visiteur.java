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

    @Column(nullable = false, length = 255)
    private String adresse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categorie_id", nullable = false)
    private CategorieVisiteur categorie;

    @Column(length = 150)
    private String organisation;

    protected Visiteur() {}

    public static Visiteur creer(Long utilisateurId, String nom, String prenom, String adresse, CategorieVisiteur categorie, String organisation) {
        Visiteur v = new Visiteur();
        v.id = utilisateurId;
        v.nom = nom;
        v.prenom = prenom;
        v.adresse = adresse;
        v.categorie = categorie;
        v.organisation = organisation;
        return v;
    }

    public Long getId() { return id; }
    public String getNom() { return nom; }
    public String getPrenom() { return prenom; }
    public String getAdresse() { return adresse; }
    public CategorieVisiteur getCategorie() { return categorie; }
    public String getOrganisation() { return organisation; }
}
