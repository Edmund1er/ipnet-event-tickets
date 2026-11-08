package tg.ipnetinstitute.technology.features.notification.domaine;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Table Transactional Outbox (Section 9.9, Exigence Fiabilité Section 6).
 * Élimine toute perte de notification en cas de panne réseau ou redémarrage du serveur.
 */
@Entity
@Table(name = "outbox_notification")
public class OutboxNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ModeCanal canal;

    @Column(nullable = false, length = 255)
    private String destinataire;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ModeleNotification modele;

    @Column(name = "charge", columnDefinition = "TEXT", nullable = false)
    private String charge;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private StatutOutbox statut;

    @Column(nullable = false)
    private short tentatives = 0;

    @Column(name = "cree_le", nullable = false, updatable = false)
    private LocalDateTime creeLe;

    protected OutboxNotification() {}

    public static OutboxNotification creer(ModeCanal canal, String destinataire, ModeleNotification modele, String charge) {
        OutboxNotification n = new OutboxNotification();
        n.canal = canal;
        n.destinataire = destinataire;
        n.modele = modele;
        n.charge = charge;
        n.statut = StatutOutbox.EN_ATTENTE;
        n.tentatives = 0;
        n.creeLe = LocalDateTime.now();
        return n;
    }

    public void marquerSucces() {
        this.statut = StatutOutbox.ENVOYEE;
    }

    public void marquerEchec() {
        this.tentatives++;
        if (this.tentatives >= 5) {
            this.statut = StatutOutbox.ECHEC;
        }
    }

    public Long getId() { return id; }
    public ModeCanal getCanal() { return canal; }
    public String getDestinataire() { return destinataire; }
    public ModeleNotification getModele() { return modele; }
    public String getCharge() { return charge; }
    public StatutOutbox getStatut() { return statut; }
    public short getTentatives() { return tentatives; }
    public LocalDateTime getCreeLe() { return creeLe; }
}
