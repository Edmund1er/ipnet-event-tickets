package tg.ipnetinstitute.technology.features.reservation.domaine;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entité Inscription (réservation d'un événement).
 * Respect des contraintes UNIQUE (utilisateur_id, evenement_id) et verrous optimistes.
 */
@Entity
@Table(
    name = "inscription",
    uniqueConstraints = @UniqueConstraint(name = "uk_inscription_utilisateur_evenement", columnNames = {"utilisateur_id", "evenement_id"})
)
public class Inscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "utilisateur_id", nullable = false)
    private Long utilisateurId;

    @Column(name = "evenement_id", nullable = false)
    private Long evenementId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatutInscription statut;

    @Column(name = "cree_le", nullable = false, updatable = false)
    private LocalDateTime creeLe;

    @Column(name = "expire_le")
    private LocalDateTime expireLe;

    @Column(name = "motif_annulation", length = 50)
    private String motifAnnulation;

    @Version
    @Column(nullable = false)
    private Long version;

    protected Inscription() {}

    public static Inscription nouvelle(Long utilisateurId, Long evenementId, int expirationHeures) {
        Inscription i = new Inscription();
        i.utilisateurId = utilisateurId;
        i.evenementId = evenementId;
        i.statut = StatutInscription.EN_ATTENTE_PAIEMENT;
        i.creeLe = LocalDateTime.now();
        i.expireLe = i.creeLe.plusHours(expirationHeures);
        return i;
    }

    public void transitionnerVers(StatutInscription cible, String motif) {
        if (!statut.peutPasserA(cible)) {
            throw new IllegalStateException("Transition de statut interdite de " + statut + " vers " + cible);
        }
        this.statut = cible;
        if (motif != null) {
            this.motifAnnulation = motif;
        }
    }

    public Long getId() { return id; }
    public Long getUtilisateurId() { return utilisateurId; }
    public Long getEvenementId() { return evenementId; }
    public StatutInscription getStatut() { return statut; }
    public LocalDateTime getCreeLe() { return creeLe; }
    public LocalDateTime getExpireLe() { return expireLe; }
    public String getMotifAnnulation() { return motifAnnulation; }
    public Long getVersion() { return version; }
}
