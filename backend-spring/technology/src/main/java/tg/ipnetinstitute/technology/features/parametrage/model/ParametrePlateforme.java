package tg.ipnetinstitute.technology.features.parametrage.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** Paramètre de la plateforme modifiable par l'administrateur (clé / valeur). */
@Entity
@Table(name = "parametre_plateforme")
public class ParametrePlateforme {

    @Id
    @Column(length = 60)
    private String cle;

    @Column(nullable = false, length = 500)
    private String valeur;

    @Column(name = "modifie_le", nullable = false)
    private LocalDateTime modifieLe;

    @Column(name = "modifie_par")
    private Long modifiePar;

    protected ParametrePlateforme() {}

    public static ParametrePlateforme de(CleParametre cle, String valeur, Long auteur) {
        ParametrePlateforme p = new ParametrePlateforme();
        p.cle = cle.name();
        p.modifier(valeur, auteur);
        return p;
    }

    public void modifier(String valeur, Long auteur) {
        this.valeur = valeur;
        this.modifiePar = auteur;
        this.modifieLe = LocalDateTime.now();
    }

    public String getCle() { return cle; }
    public String getValeur() { return valeur; }
    public LocalDateTime getModifieLe() { return modifieLe; }
    public Long getModifiePar() { return modifiePar; }
}
