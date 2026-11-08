package tg.ipnetinstitute.technology.features.identite.model;

import jakarta.persistence.*;

@Entity
@Table(name = "filiere")
public class Filiere {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String libelle;

    @Column(nullable = false)
    private boolean actif = true;

    protected Filiere() {}

    public Filiere(String libelle) {
        this.libelle = libelle;
        this.actif = true;
    }

    public Long getId() { return id; }
    public String getLibelle() { return libelle; }
    public boolean isActif() { return actif; }
}
