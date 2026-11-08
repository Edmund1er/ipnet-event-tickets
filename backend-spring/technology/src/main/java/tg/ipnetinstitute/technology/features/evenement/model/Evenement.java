package tg.ipnetinstitute.technology.features.evenement.model;

import jakarta.persistence.*;
import tg.ipnetinstitute.technology.common.exception.CapaciteAtteinteException;
import tg.ipnetinstitute.technology.common.exception.DateEvenementPasseeException;
import tg.ipnetinstitute.technology.common.exception.EvenementNonReservableException;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDateTime;

/**
 * Entité Événement avec protection stricte des invariants métiers (RG-07, RG-08, RG-09).
 */
@Entity
@Table(name = "evenement")
public class Evenement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "date_debut", nullable = false)
    private LocalDateTime dateDebut;

    @Column(length = 255)
    private String lieu;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal prix;

    @Column(nullable = false, length = 3)
    private String devise;

    @Column(nullable = false)
    private int capacite;

    @Column(name = "places_reservees", nullable = false)
    private int placesReservees = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutEvenement statut;

    @Column(name = "cree_par", nullable = false)
    private Long creePar;

    @Column(name = "cree_le", nullable = false, updatable = false)
    private LocalDateTime creeLe;

    @Version
    @Column(nullable = false)
    private Long version;

    protected Evenement() {}

    public static Evenement creer(String titre, String description, LocalDateTime dateDebut, String lieu,
                                  BigDecimal prix, String devise, int capacite, Long adminId) {
        if (capacite <= 0) {
            throw new IllegalArgumentException("La capacité de l'événement doit être strictement positive");
        }
        if (prix.signum() < 0) {
            throw new IllegalArgumentException("Le prix ne peut être négatif");
        }
        Evenement e = new Evenement();
        e.titre = titre;
        e.description = description;
        e.dateDebut = dateDebut;
        e.lieu = lieu;
        e.prix = prix;
        e.devise = devise;
        e.capacite = capacite;
        e.placesReservees = 0;
        e.statut = StatutEvenement.BROUILLON;
        e.creePar = adminId;
        e.creeLe = LocalDateTime.now();
        return e;
    }

    public void modifier(String titre, String description, LocalDateTime dateDebut, String lieu,
                         BigDecimal prix, String devise, int capacite) {
        if (capacite <= 0) {
            throw new IllegalArgumentException("La capacité de l'événement doit être strictement positive");
        }
        if (prix.signum() < 0) {
            throw new IllegalArgumentException("Le prix ne peut être négatif");
        }
        if (capacite < this.placesReservees) {
            throw new IllegalArgumentException("La nouvelle capacité ne peut pas être inférieure aux places déjà réservées");
        }
        this.titre = titre;
        this.description = description;
        this.dateDebut = dateDebut;
        this.lieu = lieu;
        this.prix = prix;
        this.devise = devise;
        this.capacite = capacite;
    }

    /** Invariant : jamais plus de places réservées que de capacité (RG-08). */
    public void reserverPlace() {
        exigerStatut(StatutEvenement.PUBLIE);
        if (placesReservees >= capacite) {
            throw new CapaciteAtteinteException(id);
        }
        placesReservees++;
    }

    /** Libération de place (RG-09). */
    public void libererPlace() {
        if (placesReservees > 0) {
            placesReservees--;
        }
    }

    public void publier(Clock horloge) {
        if (dateDebut.isBefore(LocalDateTime.now(horloge))) {
            throw new DateEvenementPasseeException(id);
        }
        statut = StatutEvenement.PUBLIE;
    }

    public void annuler() {
        this.statut = StatutEvenement.ANNULE;
    }

    private void exigerStatut(StatutEvenement attendu) {
        if (statut != attendu) {
            throw new EvenementNonReservableException(id, statut);
        }
    }

    public Long getId() { return id; }
    public String getTitre() { return titre; }
    public String getDescription() { return description; }
    public LocalDateTime getDateDebut() { return dateDebut; }
    public String getLieu() { return lieu; }
    public BigDecimal getPrix() { return prix; }
    public String getDevise() { return devise; }
    public int getCapacite() { return capacite; }
    public int getPlacesReservees() { return placesReservees; }
    public StatutEvenement getStatut() { return statut; }
    public Long getCreePar() { return creePar; }
    public LocalDateTime getCreeLe() { return creeLe; }
    public Long getVersion() { return version; }
}
