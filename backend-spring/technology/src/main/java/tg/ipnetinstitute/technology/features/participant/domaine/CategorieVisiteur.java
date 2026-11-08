package tg.ipnetinstitute.technology.features.participant.domaine;

import jakarta.persistence.*;

@Entity
@Table(name = "categorie_visiteur")
public class CategorieVisiteur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String code; // PARENT, ETUDIANT_EXTERNE, RECRUTEUR, AUTRE

    @Column(nullable = false, length = 100)
    private String libelle;

    @Column(nullable = false)
    private boolean actif = true;

    protected CategorieVisiteur() {}

    public CategorieVisiteur(String code, String libelle) {
        this.code = code;
        this.libelle = libelle;
        this.actif = true;
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getLibelle() { return libelle; }
    public boolean isActif() { return actif; }
}
