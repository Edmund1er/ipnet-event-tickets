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
        if (inscriptions.countByEvenementIdAndStatut(evenementId, StatutInscription.CONFIRMEE) > 0
                && !memesInformations(e, modif)) {
            throw new IllegalStateException("Cet événement a déjà des réservations confirmées : "
                    + "seuls le nombre de places et la date limite de réservation peuvent encore être modifiés");
        }
        e.modifier(
                modif.titre(),
                modif.description(),
                modif.dateDebut(),
                modif.lieu(),
                modif.prix(),
                modif.devise().trim().toUpperCase(),
                modif.capacite()
        );
        e.definirDateLimite(modif.dateLimiteReservation());
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
        return toResume(evenements.save(e));
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
        var passes = evenements.findByStatutAndDateDebutBefore(StatutEvenement.PUBLIE, LocalDateTime.now().minusHours(24));
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
        return evenements.findAll(FiltresEvenementUtils.specification(StatutEvenement.PUBLIE, filtre), pageable)
                .map(this::toResume);
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
                e.ventesOuvertes(LocalDateTime.now())
        );
    }
}
