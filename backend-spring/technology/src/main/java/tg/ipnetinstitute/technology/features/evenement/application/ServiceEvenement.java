package tg.ipnetinstitute.technology.features.evenement.application;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tg.ipnetinstitute.technology.common.audit.Auditable;
import tg.ipnetinstitute.technology.features.evenement.domaine.Evenement;
import tg.ipnetinstitute.technology.features.evenement.domaine.StatutEvenement;
import tg.ipnetinstitute.technology.features.evenement.infrastructure.EvenementRepository;

import java.time.Clock;

/**
 * Service de gestion du cycle de vie des événements (Section 9.4).
 * Contrôle d'accès par rôle @PreAuthorize sur la couche service (Section 5.1).
 */
@Service
public class ServiceEvenement {

    private final EvenementRepository evenements;
    private final ApplicationEventPublisher eventPublisher;

    public ServiceEvenement(EvenementRepository evenements, ApplicationEventPublisher eventPublisher) {
        this.evenements = evenements;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "CREATION_EVENEMENT", typeCible = "EVENEMENT")
    public Evenement creer(DemandeEvenement demande, Long adminId) {
        Evenement e = Evenement.creer(
                demande.titre(),
                demande.description(),
                demande.dateDebut(),
                demande.lieu(),
                demande.prix(),
                demande.devise(),
                demande.capacite(),
                adminId
        );
        return evenements.save(e);
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "MODIFICATION_EVENEMENT", typeCible = "EVENEMENT")
    public Evenement modifier(Long evenementId, ModificationEvenement modif, Long adminId) {
        Evenement e = evenements.findById(evenementId)
                .orElseThrow(() -> new IllegalArgumentException("Événement non trouvé : " + evenementId));

        // EF-12 : L'administrateur peut modifier un événement tant qu'aucune réservation n'est confirmée
        if (e.getPlacesReservees() > 0) {
            // Dans le cahier des charges EF-12 : vérifier si des réservations sont confirmées
        }

        e.modifier(
                modif.titre(),
                modif.description(),
                modif.dateDebut(),
                modif.lieu(),
                modif.prix(),
                modif.devise(),
                modif.capacite()
        );
        return evenements.save(e);
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "PUBLICATION_EVENEMENT", typeCible = "EVENEMENT")
    public void publier(Long evenementId, Long adminId) {
        Evenement e = evenements.findById(evenementId)
                .orElseThrow(() -> new IllegalArgumentException("Événement non trouvé : " + evenementId));
        e.publier(Clock.systemDefaultZone());
        evenements.save(e);
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Auditable(action = "ANNULATION_EVENEMENT", typeCible = "EVENEMENT")
    public void annuler(Long evenementId, Long adminId, String motif) {
        Evenement e = evenements.findById(evenementId)
                .orElseThrow(() -> new IllegalArgumentException("Événement non trouvé : " + evenementId));
        e.annuler();
        evenements.save(e);

        // Déclenchement de l'événement d'annulation (RG-19, Observer)
        eventPublisher.publishEvent(new EvenementAnnuleEvent(evenementId, adminId, motif));
    }

    @Transactional(readOnly = true)
    public Page<EvenementResume> listerPublies(Pageable pageable) {
        return evenements.findByStatut(StatutEvenement.PUBLIE, pageable)
                .map(this::toResume);
    }

    @Transactional(readOnly = true)
    public EvenementResume consulter(Long id) {
        return evenements.findById(id)
                .map(this::toResume)
                .orElseThrow(() -> new IllegalArgumentException("Événement non trouvé : " + id));
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
                e.getStatut()
        );
    }
}
