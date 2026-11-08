package tg.ipnetinstitute.technology.features.controle.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "journal_scan")
public class JournalScan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "billet_id")
    private UUID billetId;

    @Column(name = "evenement_id", nullable = false)
    private Long evenementId;

    @Column(name = "agent_id", nullable = false)
    private Long agentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ResultatScanEnum resultat;

    @Column(nullable = false)
    private LocalDateTime horodatage;

    protected JournalScan() {}

    public JournalScan(UUID billetId, Long evenementId, Long agentId, ResultatScanEnum resultat, LocalDateTime horodatage) {
        this.billetId = billetId;
        this.evenementId = evenementId;
        this.agentId = agentId;
        this.resultat = resultat;
        this.horodatage = horodatage;
    }

    public Long getId() { return id; }
    public UUID getBilletId() { return billetId; }
    public Long getEvenementId() { return evenementId; }
    public Long getAgentId() { return agentId; }
    public ResultatScanEnum getResultat() { return resultat; }
    public LocalDateTime getHorodatage() { return horodatage; }
}
