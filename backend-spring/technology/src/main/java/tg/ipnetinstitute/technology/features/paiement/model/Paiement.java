package tg.ipnetinstitute.technology.features.paiement.model;
import tg.ipnetinstitute.technology.common.utils.Montant;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entité Paiement conforme RG-13, RG-15, RG-17, RG-21.
 * Montant et devise figés dès la création de l'enregistrement.
 */
@Entity
@Table(name = "paiement")
public class Paiement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "inscription_id", nullable = false, unique = true)
    private Long inscriptionId;

    @Column(name = "reference_operateur", length = 50, unique = true)
    private String referenceOperateur;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal montant;

    @Column(nullable = false, length = 3)
    private String devise;

    @Column(name = "chemin_preuve", length = 255)
    private String cheminPreuve;

    @Column(name = "empreinte_preuve", length = 64, unique = true)
    private String empreintePreuve;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutPaiement statut;

    @Column(name = "valide_par")
    private Long validePar;

    @Column(name = "valide_le")
    private LocalDateTime valideLe;

    @Column(name = "motif_rejet", length = 255)
    private String motifRejet;

    @Version
    @Column(nullable = false)
    private Long version;

    protected Paiement() {}

    public static Paiement initialiser(Long inscriptionId, BigDecimal montant, String devise) {
        Paiement p = new Paiement();
        p.inscriptionId = inscriptionId;
        p.montant = montant;
        p.devise = devise;
        p.statut = StatutPaiement.EN_ATTENTE;
        return p;
    }

    public void soumettrePreuve(String referenceOperateur, String cheminPreuve, String empreinteSha256) {
        this.referenceOperateur = referenceOperateur;
        this.cheminPreuve = cheminPreuve;
        this.empreintePreuve = empreinteSha256;
        this.statut = StatutPaiement.EN_ATTENTE;
        this.motifRejet = null;
    }

    public void valider(Long adminId) {
        this.statut = StatutPaiement.VALIDE;
        this.validePar = adminId;
        this.valideLe = LocalDateTime.now();
    }

    public void rejeter(Long adminId, String motif) {
        this.statut = StatutPaiement.REJETE;
        this.validePar = adminId;
        this.valideLe = LocalDateTime.now();
        this.motifRejet = motif;
    }

    public void marquerARembourser() {
        this.statut = StatutPaiement.A_REMBOURSER;
    }

    public void marquerRembourse() {
        this.statut = StatutPaiement.REMBOURSE;
    }

    public Long getId() { return id; }
    public Long getInscriptionId() { return inscriptionId; }
    public String getReferenceOperateur() { return referenceOperateur; }
    public BigDecimal getMontant() { return montant; }
    public String getDevise() { return devise; }
    public String getCheminPreuve() { return cheminPreuve; }
    public String getEmpreintePreuve() { return empreintePreuve; }
    public StatutPaiement getStatut() { return statut; }
    public Long getValidePar() { return validePar; }
    public LocalDateTime getValideLe() { return valideLe; }
    public String getMotifRejet() { return motifRejet; }
    public Long getVersion() { return version; }
}
