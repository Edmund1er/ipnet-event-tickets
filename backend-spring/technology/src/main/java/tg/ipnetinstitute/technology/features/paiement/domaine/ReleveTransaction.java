package tg.ipnetinstitute.technology.features.paiement.domaine;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Table des relevés importés pour le rapprochement automatique (EF-26).
 */
@Entity
@Table(name = "releve_transaction")
public class ReleveTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reference_operateur", nullable = false, unique = true, length = 50)
    private String referenceOperateur;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal montant;

    @Column(name = "date_transaction")
    private LocalDateTime dateTransaction;

    @Column(name = "importe_le", nullable = false)
    private LocalDateTime importeLe;

    @Column(nullable = false)
    private boolean rapproche = false;

    protected ReleveTransaction() {}

    public ReleveTransaction(String referenceOperateur, BigDecimal montant, LocalDateTime dateTransaction) {
        this.referenceOperateur = referenceOperateur;
        this.montant = montant;
        this.dateTransaction = dateTransaction;
        this.importeLe = LocalDateTime.now();
        this.rapproche = false;
    }

    public void marquerRapproche() {
        this.rapproche = true;
    }

    public Long getId() { return id; }
    public String getReferenceOperateur() { return referenceOperateur; }
    public BigDecimal getMontant() { return montant; }
    public LocalDateTime getDateTransaction() { return dateTransaction; }
    public LocalDateTime getImporteLe() { return importeLe; }
    public boolean isRapproche() { return rapproche; }
}
