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

    @Column(name = "date_limite_reservation")
    private LocalDateTime dateLimiteReservation;

    @Column(name = "ventes_suspendues", nullable = false)
    private boolean ventesSuspendues = false;

    @Column(name = "image_chemin", length = 255)
    private String imageChemin;

    @Column(nullable = false)
    private boolean masque = false;

    @Column(name = "parent_id")
    private Long parentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private TypeEvenement type = TypeEvenement.EVENEMENT;

    @Column(name = "date_fin")
    private LocalDateTime dateFin;

    @Column(length = 30)
    private String categorie;

    @Column(name = "acces_libre", nullable = false)
    private boolean accesLibre = false;

    @Column(name = "pass_portee", length = 10)
    private String passPortee;

    @Column(name = "pass_jour")
    private java.time.LocalDate passJour;

    @Column(length = 30)
    private String ambiance;

    @Column(length = 20)
    private String modele;

    @Column(name = "couleur_principale", length = 7)
    private String couleurPrincipale;

    @Version
    @Column(nullable = false)
    private Long version;

    protected Evenement() {}

    public static Evenement creer(String titre, String description, LocalDateTime dateDebut, String lieu,
                                  BigDecimal prix, String devise, int capacite, Long adminId) {
        return creer(titre, description, dateDebut, lieu, prix, devise, capacite, null, adminId);
    }

    public static Evenement creer(String titre, String description, LocalDateTime dateDebut, String lieu,
                                  BigDecimal prix, String devise, int capacite,
                                  LocalDateTime dateLimite, Long adminId) {
        if (dateLimite != null && dateLimite.isAfter(dateDebut)) {
            throw new IllegalArgumentException("La date limite de réservation ne peut pas dépasser le début de l'événement");
        }
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
        e.dateLimiteReservation = dateLimite;
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

    /**
     * Ajuste la capacité, y compris sur un événement complet (jamais sous les places déjà réservées).
     * Si de la place se libère, la vente se rouvre d'elle-même (la condition « ventes ouvertes » est calculée).
     */
    public void ajusterCapacite(int nouvelleCapacite) {
        exigerModifiable();
        if (nouvelleCapacite <= 0) {
            throw new IllegalArgumentException("La capacité de l'événement doit être strictement positive");
        }
        if (nouvelleCapacite < placesReservees) {
            throw new IllegalArgumentException("La capacité ne peut pas être inférieure au nombre de places déjà réservées ("
                    + placesReservees + ")");
        }
        this.capacite = nouvelleCapacite;
    }

    /** Date limite de réservation : facultative, jamais après le début de l'événement. */
    public void definirDateLimite(LocalDateTime limite) {
        exigerModifiable();
        if (limite != null && limite.isAfter(dateDebut)) {
            throw new IllegalArgumentException("La date limite de réservation ne peut pas dépasser le début de l'événement");
        }
        this.dateLimiteReservation = limite;
    }

    /** Fermeture manuelle des ventes (réversible). */
    public void suspendreVentes() {
        exigerModifiable();
        this.ventesSuspendues = true;
    }

    /** Réouverture manuelle des ventes. */
    public void reprendreVentes() {
        exigerModifiable();
        this.ventesSuspendues = false;
    }

    /**
     * Vente ouverte : événement publié, non commencé, date limite non dépassée,
     * places disponibles et ventes non suspendues. Entièrement calculé : aucune tâche planifiée.
     */
    public boolean ventesOuvertes(LocalDateTime maintenant) {
        return statut == StatutEvenement.PUBLIE
                && !ventesSuspendues
                && placesReservees < capacite
                && !finDeVente().isBefore(maintenant)
                && estReservable()
                && (dateLimiteReservation == null || !dateLimiteReservation.isBefore(maintenant));
    }

    private void exigerModifiable() {
        if (statut == StatutEvenement.TERMINE || statut == StatutEvenement.ANNULE) {
            throw new IllegalStateException("Cet événement est " + (statut == StatutEvenement.ANNULE ? "annulé" : "terminé") + " : cette action n'est plus possible");
        }
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
        if (finDeVente().isBefore(LocalDateTime.now(horloge))) {
            throw new DateEvenementPasseeException(id);
        }
        statut = StatutEvenement.PUBLIE;
    }

    public void annuler() {
        if (statut == StatutEvenement.TERMINE || statut == StatutEvenement.ANNULE) {
            throw new tg.ipnetinstitute.technology.common.exception.TransitionEvenementIllegaleException(id, statut);
        }
        this.statut = StatutEvenement.ANNULE;
    }

    /** Clôture de l'événement (manuelle ou automatique après la date). */
    public void terminer() {
        if (statut != StatutEvenement.PUBLIE) {
            throw new tg.ipnetinstitute.technology.common.exception.TransitionEvenementIllegaleException(id, statut);
        }
        statut = StatutEvenement.TERMINE;
    }

    /** EF-10 : image facultative (nom de fichier aléatoire du stockage, ou null pour la retirer). */
    public void definirImage(String cheminImage) {
        this.imageChemin = cheminImage;
    }

    /** Structure : cadre, activité ou pass. */
    public void definirStructure(TypeEvenement type, Long parentId, LocalDateTime dateFin, String categorie,
                                 boolean accesLibre, String passPortee, java.time.LocalDate passJour) {
        if (dateFin != null && dateFin.isBefore(dateDebut)) {
            throw new IllegalArgumentException("La date de fin ne peut pas précéder la date de début");
        }
        this.type = type;
        this.parentId = parentId;
        this.dateFin = dateFin;
        this.categorie = categorie;
        this.accesLibre = accesLibre;
        this.passPortee = passPortee;
        this.passJour = passJour;
    }

    /** Un pass reste en vente pendant tout le programme ; les autres événements jusqu'à leur début. */
    public LocalDateTime finDeVente() {
        return (type == TypeEvenement.PASS && dateFin != null) ? dateFin : dateDebut;
    }

    /** Référence de la clôture automatique : la fin si elle existe, sinon le début. */
    public LocalDateTime finEffective() {
        return dateFin != null ? dateFin : dateDebut;
    }

    /** Un cadre ne se vend pas ; une activité en accès libre non plus. */
    public boolean estReservable() {
        return type != TypeEvenement.CADRE && !accesLibre;
    }

    /** Un événement est « passé » quand sa fin (ou son début, sans fin) est derrière nous. */
    public boolean estPasse(LocalDateTime maintenant) {
        return finEffective().isBefore(maintenant);
    }

    /** Masquage définitif : réservé aux événements passés, terminés ou annulés. */
    public void masquer(LocalDateTime maintenant) {
        if (!estPasse(maintenant) && statut != StatutEvenement.TERMINE && statut != StatutEvenement.ANNULE) {
            throw new IllegalStateException("Seul un événement passé, terminé ou annulé peut être masqué");
        }
        this.masque = true;
    }

    public boolean isMasque() { return masque; }
    public Long getParentId() { return parentId; }
    public TypeEvenement getType() { return type; }
    public LocalDateTime getDateFin() { return dateFin; }
    public String getCategorie() { return categorie; }
    public boolean isAccesLibre() { return accesLibre; }
    public String getPassPortee() { return passPortee; }
    public java.time.LocalDate getPassJour() { return passJour; }

    /** Apparence de la page publique (purement visuelle, modifiable à tout moment). */
    public void definirApparence(String ambiance, String couleurPrincipale) {
        this.ambiance = ambiance;
        this.couleurPrincipale = couleurPrincipale == null ? null : couleurPrincipale.toLowerCase();
    }

    public void definirApparence(String ambiance, String couleurPrincipale, String modele) {
        definirApparence(ambiance, couleurPrincipale);
        this.modele = modele;
    }

    public String getModele() { return modele; }
    public String getAmbiance() { return ambiance; }
    public String getCouleurPrincipale() { return couleurPrincipale; }
    public String getImageChemin() { return imageChemin; }
    public LocalDateTime getDateLimiteReservation() { return dateLimiteReservation; }
    public boolean isVentesSuspendues() { return ventesSuspendues; }

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
