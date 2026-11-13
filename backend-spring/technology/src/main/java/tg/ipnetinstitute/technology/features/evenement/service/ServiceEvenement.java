package tg.ipnetinstitute.technology.features.evenement.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tg.ipnetinstitute.technology.common.exception.RessourceIntrouvableException;
import tg.ipnetinstitute.technology.config.Auditable;
import tg.ipnetinstitute.technology.features.evenement.dto.request.ApparenceEvenement;
import tg.ipnetinstitute.technology.features.evenement.dto.request.DemandeActivite;
import tg.ipnetinstitute.technology.features.evenement.model.TypeEvenement;
import tg.ipnetinstitute.technology.features.evenement.dto.request.DemandeEvenement;
import tg.ipnetinstitute.technology.features.evenement.dto.request.ModificationEvenement;
import tg.ipnetinstitute.technology.features.evenement.dto.response.EvenementResume;
import tg.ipnetinstitute.technology.features.evenement.model.Evenement;
import tg.ipnetinstitute.technology.features.evenement.model.StatutEvenement;
import tg.ipnetinstitute.technology.features.evenement.repository.EvenementRepository;
import tg.ipnetinstitute.technology.features.evenement.utils.FiltresEvenementUtils;
import tg.ipnetinstitute.technology.features.evenement.wrapper.StockageImageWrapper;
import tg.ipnetinstitute.technology.features.reservation.model.StatutInscription;
import tg.ipnetinstitute.technology.features.reservation.repository.InscriptionRepository;

import java.time.Clock;
import java.time.LocalDateTime;

/**
 * Service de gestion du cycle de vie des événements (EF-10 à EF-14).
 * Contrôle d'accès par rôle @PreAuthorize sur la couche service (Section 5.1).
 */
@Service
public class ServiceEvenement {

    private static final Logger log = LoggerFactory.getLogger(ServiceEvenement.class);

    /** Image servie avec son type MIME. */
    public record ImageEvenement(Resource contenu, String typeMime) {}

    private final EvenementRepository evenements;
    private final InscriptionRepository inscriptions;
    private final StockageImageWrapper stockageImage;
    private final ApplicationEventPublisher eventPublisher;

    public ServiceEvenement(EvenementRepository evenements,
                            InscriptionRepository inscriptions,
                            StockageImageWrapper stockageImage,
                            ApplicationEventPublisher eventPublisher) {
        this.evenements = evenements;
        this.inscriptions = inscriptions;
        this.stockageImage = stockageImage;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "CREATION_EVENEMENT", typeCible = "EVENEMENT")
    public EvenementResume creer(DemandeEvenement demande, Long adminId) {
        return toResume(evenements.save(nouveau(demande, adminId)));
    }

    /**
     * Modification d'un événement. Une fois des réservations confirmées, seules la capacité et la date limite
     * restent modifiables. Verrou pessimiste, comme la réservation, pour ne jamais passer sous les places prises.
     */
    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "MODIFICATION_EVENEMENT", typeCible = "EVENEMENT")
    public EvenementResume modifier(Long evenementId, ModificationEvenement modif, Long adminId) {
        Evenement e = chargerPourModification(evenementId);
        if (inscriptions.countByEvenementIdAndStatut(evenementId, StatutInscription.CONFIRMEE) > 0) {
            throw new IllegalStateException("Cet événement a déjà des réservations confirmées : il ne peut plus être modifié (EF-12)");
        }
        boolean cadre = e.getType() == TypeEvenement.CADRE;
        e.modifier(
                modif.titre(),
                modif.description(),
                modif.dateDebut(),
                modif.lieu(),
                cadre ? java.math.BigDecimal.ZERO : modif.prix(),
                modif.devise().trim().toUpperCase(),
                cadre ? 1 : modif.capacite()
        );
        if (cadre) {
            if (modif.dateFin() == null) {
                throw new IllegalArgumentException("La date de fin du programme est obligatoire");
            }
            e.definirStructure(TypeEvenement.CADRE, null, modif.dateFin(), null, false, null, null);
        }
        e.definirDateLimite(modif.dateLimiteReservation());
        return toResume(evenements.save(e));
    }

    /** Apparence de la page : purement visuelle, donc modifiable même avec des réservations confirmées. */
    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "APPARENCE_EVENEMENT", typeCible = "EVENEMENT")
    public EvenementResume definirApparence(Long evenementId, ApparenceEvenement apparence, Long adminId) {
        Evenement e = chargerPourModification(evenementId);
        e.definirApparence(apparence.ambiance(), apparence.couleurPrincipale());
        return toResume(evenements.save(e));
    }

    /** Fermeture manuelle des ventes (réversible). */
    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "FERMETURE_VENTES", typeCible = "EVENEMENT")
    public EvenementResume fermerVentes(Long evenementId, Long adminId) {
        Evenement e = chargerPourModification(evenementId);
        e.suspendreVentes();
        return toResume(evenements.save(e));
    }

    /** Réouverture manuelle des ventes. */
    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "REOUVERTURE_VENTES", typeCible = "EVENEMENT")
    public EvenementResume rouvrirVentes(Long evenementId, Long adminId) {
        Evenement e = chargerPourModification(evenementId);
        e.reprendreVentes();
        return toResume(evenements.save(e));
    }

    private Evenement chargerPourModification(Long id) {
        Evenement e = evenements.findByIdForUpdate(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Événement", id));
        if (e.getStatut() == StatutEvenement.ANNULE || e.getStatut() == StatutEvenement.TERMINE) {
            throw new IllegalStateException("Cet événement est "
                    + (e.getStatut() == StatutEvenement.ANNULE ? "annulé" : "terminé") + " : il ne peut plus être modifié");
        }
        return e;
    }

    private static boolean memesInformations(Evenement e, ModificationEvenement m) {
        return java.util.Objects.equals(e.getTitre(), m.titre())
                && java.util.Objects.toString(e.getDescription(), "").equals(java.util.Objects.toString(m.description(), ""))
                && java.util.Objects.toString(e.getLieu(), "").equals(java.util.Objects.toString(m.lieu(), ""))
                && e.getDateDebut().truncatedTo(java.time.temporal.ChronoUnit.MINUTES)
                        .equals(m.dateDebut().truncatedTo(java.time.temporal.ChronoUnit.MINUTES))
                && e.getPrix().compareTo(m.prix()) == 0
                && e.getDevise().equalsIgnoreCase(m.devise().trim());
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "PUBLICATION_EVENEMENT", typeCible = "EVENEMENT")
    public EvenementResume publier(Long evenementId, Long adminId) {
        Evenement e = charger(evenementId);
        if (e.getStatut() != StatutEvenement.BROUILLON) {
            throw new IllegalStateException("Seul un brouillon peut être publié");
        }
        e.publier(Clock.systemDefaultZone());
        evenements.save(e);
        if (e.getType() == TypeEvenement.CADRE) {
            // Publier un programme publie aussi ses activités et pass encore à venir
            for (Evenement fils : evenements.findByParentIdOrderByDateDebutAsc(e.getId())) {
                if (fils.getStatut() == StatutEvenement.BROUILLON && !fils.finDeVente().isBefore(LocalDateTime.now())) {
                    fils.publier(Clock.systemDefaultZone());
                    evenements.save(fils);
                }
            }
        }
        return toResume(e);
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "ANNULATION_EVENEMENT", typeCible = "EVENEMENT")
    public EvenementResume annuler(Long evenementId, Long adminId, String motif) {
        Evenement e = charger(evenementId);
        e.annuler();
        evenements.save(e);

        // Déclenchement de l'événement d'annulation (RG-19, Observer)
        eventPublisher.publishEvent(new EvenementAnnuleEvent(evenementId, adminId, motif));
        if (e.getType() == TypeEvenement.CADRE) {
            for (Evenement fils : evenements.findByParentIdOrderByDateDebutAsc(evenementId)) {
                if (fils.getStatut() == StatutEvenement.BROUILLON || fils.getStatut() == StatutEvenement.PUBLIE) {
                    fils.annuler();
                    evenements.save(fils);
                    eventPublisher.publishEvent(new EvenementAnnuleEvent(fils.getId(), adminId, motif));
                }
            }
        }
        return toResume(e);
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "CLOTURE_EVENEMENT", typeCible = "EVENEMENT")
    public EvenementResume cloturer(Long evenementId, Long adminId) {
        Evenement e = charger(evenementId);
        e.terminer();
        return toResume(evenements.save(e));
    }

    /** Clôture automatique : un événement publié passe à TERMINE 24 h après son début. */
    @Scheduled(cron = "0 15 * * * *")
    @Transactional
    public void cloturerEvenementsPasses() {
        var passes = evenements.findACloturer(StatutEvenement.PUBLIE, LocalDateTime.now().minusHours(24));
        for (Evenement e : passes) {
            e.terminer();
            evenements.save(e);
            log.info("Événement {} clôturé automatiquement", e.getId());
        }
    }

    // ---------- Image (EF-10) ----------

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "IMAGE_EVENEMENT", typeCible = "EVENEMENT")
    public EvenementResume definirImage(Long evenementId, byte[] contenu) {
        Evenement e = charger(evenementId);
        String ancienne = e.getImageChemin();
        e.definirImage(stockageImage.enregistrer(contenu));
        evenements.save(e);
        stockageImage.supprimer(ancienne);
        return toResume(e);
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "SUPPRESSION_IMAGE_EVENEMENT", typeCible = "EVENEMENT")
    public EvenementResume supprimerImage(Long evenementId) {
        Evenement e = charger(evenementId);
        String ancienne = e.getImageChemin();
        e.definirImage(null);
        evenements.save(e);
        stockageImage.supprimer(ancienne);
        return toResume(e);
    }

    /** Image publique d'un événement visible (non brouillon). */
    @Transactional(readOnly = true)
    public ImageEvenement imagePublique(Long id) {
        Evenement e = evenements.findById(id)
                .filter(ev -> ev.getStatut() != StatutEvenement.BROUILLON)
                .orElseThrow(() -> new RessourceIntrouvableException("Événement", id));
        return image(e);
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ImageEvenement imageAdmin(Long id) {
        return image(charger(id));
    }

    private ImageEvenement image(Evenement e) {
        if (e.getImageChemin() == null) {
            throw new RessourceIntrouvableException("Image de l'événement", e.getId());
        }
        return new ImageEvenement(stockageImage.lire(e.getImageChemin()), stockageImage.typeMime(e.getImageChemin()));
    }

    // ---------- Consultation ----------

    /** EF-13 : liste publique (PUBLIE uniquement), filtres titre / dates / prix, paginée. */
    @Transactional(readOnly = true)
    public Page<EvenementResume> listerPublies(FiltresEvenementUtils.Filtre filtre, Pageable pageable) {
        return listerPublies(filtre, pageable, false);
    }

    /** inclureActivites : poste de contrôle (il scanne aussi les activités d'un programme). */
    @Transactional(readOnly = true)
    public Page<EvenementResume> listerPublies(FiltresEvenementUtils.Filtre filtre, Pageable pageable, boolean inclureActivites) {
        return evenements.findAll(FiltresEvenementUtils.specification(StatutEvenement.PUBLIE, filtre, inclureActivites), pageable)
                .map(this::toResume);
    }

    // ---------- Programme : activités et pass d'un événement-cadre ----------

    /** Activités et pass d'un cadre ; le public ne voit pas les brouillons. */
    @Transactional(readOnly = true)
    public java.util.List<EvenementResume> listerActivites(Long cadreId, boolean admin) {
        Evenement cadre = charger(cadreId);
        if (!admin && cadre.getStatut() == StatutEvenement.BROUILLON) {
            throw new RessourceIntrouvableException("Événement", cadreId);
        }
        return evenements.findByParentIdOrderByDateDebutAsc(cadreId).stream()
                .filter(e -> admin || e.getStatut() != StatutEvenement.BROUILLON)
                .map(this::toResume)
                .toList();
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "CREATION_ACTIVITE", typeCible = "EVENEMENT")
    public EvenementResume creerActivite(Long cadreId, DemandeActivite d, Long adminId) {
        Evenement cadre = chargerPourModification(cadreId);
        if (cadre.getType() != TypeEvenement.CADRE) {
            throw new IllegalStateException("Seul un programme multi-jours peut recevoir des activités");
        }
        var champs = normaliser(cadre, d);
        Evenement e = Evenement.creer(d.titre(), d.description(), champs.debut(), d.lieu() != null ? d.lieu() : cadre.getLieu(),
                champs.prix(), cadre.getDevise(), champs.capacite(), champs.limite(), adminId);
        e.definirStructure(TypeEvenement.valueOf(d.type()), cadreId, champs.fin(), d.categorie(),
                champs.accesLibre(), champs.portee(), champs.jour());
        e.definirApparence(d.ambiance() != null ? d.ambiance() : cadre.getAmbiance(),
                d.couleurPrincipale() != null ? d.couleurPrincipale() : cadre.getCouleurPrincipale());
        if (cadre.getStatut() == StatutEvenement.PUBLIE && !e.finDeVente().isBefore(LocalDateTime.now())) {
            e.publier(Clock.systemDefaultZone());
        }
        return toResume(evenements.save(e));
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "MODIFICATION_ACTIVITE", typeCible = "EVENEMENT")
    public EvenementResume modifierActivite(Long activiteId, DemandeActivite d, Long adminId) {
        Evenement e = chargerPourModification(activiteId);
        if (e.getParentId() == null) {
            throw new IllegalStateException("Cet événement n'est pas une activité d'un programme");
        }
        if (inscriptions.countByEvenementIdAndStatut(activiteId, StatutInscription.CONFIRMEE) > 0) {
            throw new IllegalStateException("Cette activité a déjà des réservations confirmées : elle ne peut plus être modifiée");
        }
        Evenement cadre = charger(e.getParentId());
        var champs = normaliser(cadre, d);
        e.modifier(d.titre(), d.description(), champs.debut(), d.lieu() != null ? d.lieu() : cadre.getLieu(),
                champs.prix(), cadre.getDevise(), Math.max(champs.capacite(), e.getPlacesReservees() == 0 ? 1 : e.getPlacesReservees()));
        e.definirStructure(e.getType(), e.getParentId(), champs.fin(), d.categorie(), champs.accesLibre(), champs.portee(), champs.jour());
        e.definirDateLimite(champs.limite());
        if (d.ambiance() != null || d.couleurPrincipale() != null) {
            e.definirApparence(d.ambiance(), d.couleurPrincipale());
        }
        return toResume(evenements.save(e));
    }

    /** Suppression d'une activité : uniquement sans aucune réservation (sinon, l'annuler). */
    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "SUPPRESSION_ACTIVITE", typeCible = "EVENEMENT")
    public void supprimerActivite(Long activiteId, Long adminId) {
        Evenement e = charger(activiteId);
        if (e.getParentId() == null) {
            throw new IllegalStateException("Cet événement n'est pas une activité d'un programme");
        }
        if (e.getPlacesReservees() > 0 || inscriptions.existsByEvenementId(activiteId)) {
            throw new IllegalStateException("Cette activité a des réservations : annulez-la plutôt que de la supprimer");
        }
        evenements.delete(e);
    }

    /** Recopie les activités d'un jour sur d'autres jours (mêmes horaires, mêmes réglages). Les pass ne sont pas copiés. */
    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "DUPLICATION_JOUR", typeCible = "EVENEMENT")
    public java.util.List<EvenementResume> dupliquerJour(Long cadreId, java.time.LocalDate source,
                                                         java.util.List<java.time.LocalDate> cibles, Long adminId) {
        Evenement cadre = chargerPourModification(cadreId);
        var modeles = evenements.findByParentIdOrderByDateDebutAsc(cadreId).stream()
                .filter(a -> a.getType() == TypeEvenement.ACTIVITE
                        && a.getStatut() != StatutEvenement.ANNULE
                        && a.getDateDebut().toLocalDate().equals(source))
                .toList();
        if (modeles.isEmpty()) {
            throw new IllegalArgumentException("Aucune activité ce jour-là");
        }
        var crees = new java.util.ArrayList<EvenementResume>();
        for (java.time.LocalDate jour : cibles) {
            if (jour.equals(source)) continue;
            for (Evenement m : modeles) {
                long decalage = java.time.temporal.ChronoUnit.DAYS.between(source, jour);
                LocalDateTime debut = m.getDateDebut().plusDays(decalage);
                LocalDateTime fin = m.finEffective().plusDays(decalage);
                if (debut.isBefore(cadre.getDateDebut()) || fin.isAfter(cadre.getDateFin())) {
                    continue; // hors des dates du programme
                }
                Evenement copie = Evenement.creer(m.getTitre(), m.getDescription(), debut, m.getLieu(), m.getPrix(),
                        m.getDevise(), m.getCapacite(), null, adminId);
                copie.definirStructure(TypeEvenement.ACTIVITE, cadreId, fin, m.getCategorie(), m.isAccesLibre(), null, null);
                copie.definirApparence(m.getAmbiance(), m.getCouleurPrincipale());
                if (cadre.getStatut() == StatutEvenement.PUBLIE && !copie.finDeVente().isBefore(LocalDateTime.now())) {
                    copie.publier(Clock.systemDefaultZone());
                }
                crees.add(toResume(evenements.save(copie)));
            }
        }
        return crees;
    }

    private record ChampsActivite(LocalDateTime debut, LocalDateTime fin, java.math.BigDecimal prix, int capacite,
                                  boolean accesLibre, String portee, java.time.LocalDate jour, LocalDateTime limite) {}

    /** Règles communes de validation d'une activité ou d'un pass par rapport à son programme. */
    private ChampsActivite normaliser(Evenement cadre, DemandeActivite d) {
        LocalDateTime debut = d.dateDebut();
        LocalDateTime fin = d.dateFin();
        boolean pass = "PASS".equals(d.type());
        String portee = null;
        java.time.LocalDate jour = null;
        if (pass) {
            portee = d.passPortee() == null ? "GLOBAL" : d.passPortee();
            if ("GLOBAL".equals(portee)) {
                debut = cadre.getDateDebut();
                fin = cadre.getDateFin();
            } else {
                jour = d.passJour();
                if (jour == null) {
                    throw new IllegalArgumentException("Un pass journée doit préciser le jour concerné");
                }
                debut = jour.atStartOfDay().isBefore(cadre.getDateDebut()) ? cadre.getDateDebut() : jour.atStartOfDay();
                fin = jour.atTime(23, 59);
                if (fin.isAfter(cadre.getDateFin())) fin = cadre.getDateFin();
            }
        }
        if (fin.isBefore(debut)) {
            throw new IllegalArgumentException("La fin doit être postérieure au début");
        }
        if (debut.isBefore(cadre.getDateDebut()) || fin.isAfter(cadre.getDateFin())) {
            throw new IllegalArgumentException("L'activité doit se dérouler pendant le programme (du "
                    + cadre.getDateDebut().toLocalDate() + " au " + cadre.getDateFin().toLocalDate() + ")");
        }
        boolean libre = !pass && d.accesLibre();
        java.math.BigDecimal prix = libre ? java.math.BigDecimal.ZERO : d.prix();
        int capacite = libre ? 1 : (d.capacite() == null ? 0 : d.capacite());
        if (!libre && capacite < 1) {
            throw new IllegalArgumentException("Le nombre de places est obligatoire (hors accès libre)");
        }
        LocalDateTime limite = d.dateLimiteReservation();
        if (limite != null && limite.isAfter(pass ? fin : debut)) {
            throw new IllegalArgumentException("La date limite de réservation ne peut pas dépasser la vente");
        }
        return new ChampsActivite(debut, fin, prix, capacite, libre, portee, jour, limite);
    }

    /** Liste d'administration, tous statuts ou filtrée. */
    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public Page<EvenementResume> listerAdmin(StatutEvenement statut, FiltresEvenementUtils.Filtre filtre, Pageable pageable) {
        return evenements.findAll(FiltresEvenementUtils.specification(statut, filtre), pageable).map(this::toResume);
    }

    /** Détail public : un brouillon n'est jamais visible hors administration (EF-11). */
    @Transactional(readOnly = true)
    public EvenementResume consulterPublic(Long id) {
        return evenements.findById(id)
                .filter(e -> e.getStatut() != StatutEvenement.BROUILLON)
                .map(this::toResume)
                .orElseThrow(() -> new RessourceIntrouvableException("Événement", id));
    }

    /** Détail sans restriction de statut (administration et autres features). */
    @Transactional(readOnly = true)
    public EvenementResume consulter(Long id) {
        return toResume(charger(id));
    }

    @Transactional(readOnly = true)
    public long compterParStatut(StatutEvenement statut) {
        return evenements.countByStatut(statut);
    }

    // ---------- Initialisation ----------

    @Transactional(readOnly = true)
    public boolean aucunEvenement() {
        return evenements.count() == 0;
    }

    /** Création initiale (démarrage de la plateforme) : publié directement, image facultative. */
    @Transactional
    public EvenementResume creerEtPublierInitial(DemandeEvenement demande, Long adminId, byte[] image) {
        Evenement e = nouveau(demande, adminId);
        if (image != null) {
            e.definirImage(stockageImage.enregistrer(image));
        }
        e.publier(Clock.systemDefaultZone());
        return toResume(evenements.save(e));
    }

    private static Evenement nouveau(DemandeEvenement d, Long adminId) {
        if ("CADRE".equals(d.type())) {
            if (d.dateFin() == null) {
                throw new IllegalArgumentException("La date de fin du programme est obligatoire");
            }
            Evenement cadre = Evenement.creer(d.titre(), d.description(), d.dateDebut(), d.lieu(), java.math.BigDecimal.ZERO,
                    d.devise().trim().toUpperCase(), 1, null, adminId);
            cadre.definirStructure(TypeEvenement.CADRE, null, d.dateFin(), null, false, null, null);
            return cadre;
        }
        return Evenement.creer(d.titre(), d.description(), d.dateDebut(), d.lieu(), d.prix(),
                d.devise().trim().toUpperCase(), d.capacite(), d.dateLimiteReservation(), adminId);
    }

    private Evenement charger(Long id) {
        return evenements.findById(id).orElseThrow(() -> new RessourceIntrouvableException("Événement", id));
    }

    private EvenementResume toResume(Evenement e) {
        return new EvenementResume(
                e.getId(),
                e.getTitre(),
                e.getDescription(),
                e.getDateDebut(),
                e.getLieu(),
                e.getPrix(),
                e.getDevise(),
                e.getCapacite(),
                e.getPlacesReservees(),
                e.getStatut(),
                e.getImageChemin() != null,
                e.getDateLimiteReservation(),
                e.isVentesSuspendues(),
                e.ventesOuvertes(LocalDateTime.now()),
                e.getAmbiance(),
                e.getCouleurPrincipale(),
                e.getType(),
                e.getParentId(),
                e.getDateFin(),
                e.getCategorie(),
                e.isAccesLibre(),
                e.getPassPortee(),
                e.getPassJour()
        );
    }
}
