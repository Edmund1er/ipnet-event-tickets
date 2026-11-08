package tg.ipnetinstitute.technology.features.reservation.application;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tg.ipnetinstitute.technology.common.audit.Auditable;
import tg.ipnetinstitute.technology.features.evenement.application.EvenementAnnuleEvent;
import tg.ipnetinstitute.technology.features.evenement.domaine.Evenement;
import tg.ipnetinstitute.technology.features.evenement.infrastructure.EvenementRepository;
import tg.ipnetinstitute.technology.features.identite.domaine.Utilisateur;
import tg.ipnetinstitute.technology.features.identite.infrastructure.UtilisateurRepository;
import tg.ipnetinstitute.technology.features.reservation.domaine.Inscription;
import tg.ipnetinstitute.technology.features.reservation.domaine.StatutInscription;
import tg.ipnetinstitute.technology.features.reservation.infrastructure.InscriptionRepository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service de réservation conforme RG-06 à RG-09, Section 9.5.
 * Verrouillage pessimiste findByIdForUpdate pour éliminer les risques de survente.
 */
@Service
public class ServiceReservation {

    private final List<RegleReservation> regles;
    private final EvenementRepository evenements;
    private final InscriptionRepository inscriptions;
    private final UtilisateurRepository utilisateurs;
    private final ApplicationEventPublisher publieur;

    public ServiceReservation(List<RegleReservation> regles,
                              EvenementRepository evenements,
                              InscriptionRepository inscriptions,
                              UtilisateurRepository utilisateurs,
                              ApplicationEventPublisher publieur) {
        this.regles = regles;
        this.evenements = evenements;
        this.inscriptions = inscriptions;
        this.utilisateurs = utilisateurs;
        this.publieur = publieur;
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_PARTICIPANT')")
    @Auditable(action = "RESERVATION", typeCible = "INSCRIPTION")
    public Inscription reserver(Long utilisateurId, Long evenementId) {
        Utilisateur utilisateur = utilisateurs.findById(utilisateurId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));

        // Sérialisation des réservations sur l'événement pour éviter la surréservation
        Evenement evenement = evenements.findByIdForUpdate(evenementId)
                .orElseThrow(() -> new IllegalArgumentException("Événement introuvable : " + evenementId));

        // Chaîne de responsabilité des règles (Chain of Responsibility)
        regles.forEach(r -> r.verifier(utilisateur, evenement));

        // Décompte de la place (RG-08)
        evenement.reserverPlace();
        evenements.save(evenement);

        // Sauvegarde de l'inscription (délai configurable, ex: 48h, EF-24)
        Inscription inscription = inscriptions.save(Inscription.nouvelle(utilisateurId, evenementId, 48));

        publieur.publishEvent(new ReservationCreeeEvent(inscription.getId()));
        return inscription;
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_PARTICIPANT')")
    @Auditable(action = "ANNULATION_RESERVATION", typeCible = "INSCRIPTION")
    public void annuler(Long inscriptionId, Long utilisateurId) {
        Inscription inscription = inscriptions.findById(inscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Inscription introuvable : " + inscriptionId));

        // Contrôle de propriété OWASP A01
        if (!inscription.getUtilisateurId().equals(utilisateurId)) {
            throw new AccessDeniedException("Vous n'êtes pas propriétaire de cette réservation");
        }

        inscription.transitionnerVers(StatutInscription.ANNULEE, "Annulation par le participant");
        inscriptions.save(inscription);

        // Libération de la place (RG-09)
        evenements.findById(inscription.getEvenementId()).ifPresent(e -> {
            e.libererPlace();
            evenements.save(e);
        });
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ROLE_PARTICIPANT')")
    public Page<Inscription> mesReservations(Long utilisateurId, Pageable pageable) {
        return inscriptions.findByUtilisateurId(utilisateurId, pageable);
    }

    /**
     * Traitement automatique de l'événement d'annulation globale (RG-19).
     */
    @EventListener
    @Transactional
    public void surEvenementAnnule(EvenementAnnuleEvent evt) {
        List<Inscription> actives = inscriptions.findByEvenementIdAndStatutIn(
                evt.evenementId(),
                List.of(StatutInscription.EN_ATTENTE_PAIEMENT, StatutInscription.PREUVE_ENVOYEE, StatutInscription.CONFIRMEE)
        );

        for (Inscription i : actives) {
            i.transitionnerVers(StatutInscription.ANNULEE, "evenement_annule");
            inscriptions.save(i);
        }
    }

    /**
     * Tâche d'arrière-plan pour expirer les réservations non payées après 48h (EF-24).
     */
    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void purgerReservationsExpirees() {
        var expirees = inscriptions.findByStatutAndExpireLeBefore(StatutInscription.EN_ATTENTE_PAIEMENT, LocalDateTime.now());
        for (Inscription i : expirees) {
            i.transitionnerVers(StatutInscription.EXPIREE, "Expiration délai de paiement");
            inscriptions.save(i);

            evenements.findById(i.getEvenementId()).ifPresent(e -> {
                e.libererPlace();
                evenements.save(e);
            });
        }
    }
}
