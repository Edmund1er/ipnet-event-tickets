package tg.ipnetinstitute.technology.features.identite.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entité Historique Changement Filiere (Section 7.2, EF-09, RG-04, RG-16).
 */
@Entity
@Table(name = "historique_changement_filiere")
public class HistoriqueChangementFiliere {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "etudiant_id", nullable = false)
    private Long etudiantId;

    @Column(name = "ancienne_filiere_id")
    private Long ancienneFiliereId;

    @Column(name = "nouvelle_filiere_id", nullable = false)
    private Long nouvelleFiliereId;

    @Column(name = "modifie_le", nullable = false)
    private LocalDateTime modifieLe;

    @Column(name = "modifie_par", nullable = false)
    private Long modifiePar;

    protected HistoriqueChangementFiliere() {}

    public HistoriqueChangementFiliere(Long etudiantId, Long ancienneFiliereId, Long nouvelleFiliereId, Long modifiePar) {
        this.etudiantId = etudiantId;
        this.ancienneFiliereId = ancienneFiliereId;
        this.nouvelleFiliereId = nouvelleFiliereId;
        this.modifieLe = LocalDateTime.now();
        this.modifiePar = modifiePar;
    }

    public Long getId() { return id; }
    public Long getEtudiantId() { return etudiantId; }
    public Long getAncienneFiliereId() { return ancienneFiliereId; }
    public Long getNouvelleFiliereId() { return nouvelleFiliereId; }
    public LocalDateTime getModifieLe() { return modifieLe; }
    public Long getModifiePar() { return modifiePar; }
}
