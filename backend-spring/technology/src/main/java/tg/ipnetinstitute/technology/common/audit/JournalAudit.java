package tg.ipnetinstitute.technology.common.audit;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "journal_audit")
public class JournalAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "acteur_id")
    private Long acteurId;

    @Column(name = "action", nullable = false, length = 50)
    private String action;

    @Column(name = "type_cible", nullable = false, length = 50)
    private String typeCible;

    @Column(name = "id_cible", nullable = false, length = 50)
    private String idCible;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @Column(name = "horodatage", nullable = false)
    private LocalDateTime horodatage;

    protected JournalAudit() {}

    public JournalAudit(Long acteurId, String action, String typeCible, String idCible, String details, LocalDateTime horodatage) {
        this.acteurId = acteurId;
        this.action = action;
        this.typeCible = typeCible;
        this.idCible = idCible;
        this.details = details;
        this.horodatage = horodatage;
    }

    public Long getId() { return id; }
    public Long getActeurId() { return acteurId; }
    public String getAction() { return action; }
    public String getTypeCible() { return typeCible; }
    public String getIdCible() { return idCible; }
    public String getDetails() { return details; }
    public LocalDateTime getHorodatage() { return horodatage; }
}
