package tg.ipnetinstitute.technology.features.reservation.service;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tg.ipnetinstitute.technology.common.exception.RessourceIntrouvableException;
import tg.ipnetinstitute.technology.config.Auditable;
import tg.ipnetinstitute.technology.features.evenement.service.ServiceEvenement;
import tg.ipnetinstitute.technology.features.reservation.dto.response.ReservationResponse;
import tg.ipnetinstitute.technology.features.evenement.service.EvenementAnnuleEvent;
import tg.ipnetinstitute.technology.features.evenement.model.Evenement;
import tg.ipnetinstitute.technology.features.evenement.repository.EvenementRepository;
import tg.ipnetinstitute.technology.features.identite.model.Utilisateur;
import tg.ipnetinstitute.technology.features.identite.repository.UtilisateurRepository;
import tg.ipnetinstitute.technology.features.reservation.model.Inscription;
import tg.ipnetinstitute.technology.features.reservation.model.StatutInscription;
import tg.ipnetinstitute.technology.features.reservation.repository.InscriptionRepository;

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
    private final ServiceEvenement serviceEvenement;
    private final int delaiExpirationHeures;
    private final tg.ipnetinstitute.technology.features.parametrage.service.ServiceParametres serviceParametres;

    public ServiceReservation(List<RegleReservation> regles,
                              EvenementRepository evenements,
                              InscriptionRepository inscriptions,
                              UtilisateurRepository utilisateurs,
                              ApplicationEventPublisher publieur,
                              ServiceEvenement serviceEvenement,
                              @org.springframework.beans.factory.annotation.Value("${app.reservation.expiration-heures:48}") int delaiExpirationHeures,
                              tg.ipnetinstitute.technology.features.parametrage.service.ServiceParametres serviceParametres) {
        this.regles = regles;
        this.evenements = evenements;
        this.inscriptions = inscriptions;
        this.utilisateurs = utilisateurs;
        this.publieur = publieur;
        this.serviceEvenement = serviceEvenement;
        this.delaiExpirationHeures = delaiExpirationHeures;
        this.serviceParametres = serviceParametres;
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_PARTICIPANT')")
    @Auditable(action = "RESERVATION", typeCible = "INSCRIPTION")
    public ReservationResponse reserver(Long utilisateurId, Long evenementId) {
        Utilisateur utilisateur = utilisateurs.findById(utilisateurId)
                .orElseThrow(() -> new RessourceIntrouvableException("Utilisateur", utilisateurId));

        // EF-07 : sans numéro de paiement réel, aucune réservation ne pourrait être réglée
        if (!serviceParametres.paiementConfigure()) {
            throw new tg.ipnetinstitute.technology.common.exception.PaiementNonConfigureException();
        }

        // Sérialisation des réservations sur l'événement pour éviter la surréservation
        Evenement evenement = evenements.findByIdForUpdate(evenementId)
                .orElseThrow(() -> new RessourceIntrouvableException("Événement", evenementId));

        // Chaîne de responsabilité des règles (Chain of Responsibility)
        regles.forEach(r -> r.verifier(utilisateur, evenement));

        // Décompte de la place (RG-08)
        evenement.reserverPlace();
        evenements.save(evenement);

        // Délai d'expiration configurable (EF-24) et montant figé à la réservation (RG-17)
        Inscription inscription = inscriptions.save(Inscription.nouvelle(utilisateurId, evenementId,
                delaiExpirationHeures, evenement.getPrix(), evenement.getDevise()));

        publieur.publishEvent(new ReservationCreeeEvent(inscription.getId()));
        return versResponse(inscription);
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_PARTICIPANT')")
    @Auditable(action = "ANNULATION_RESERVATION", typeCible = "INSCRIPTION")
    public void annuler(Long inscriptionId, Long utilisateurId) {
        Inscription inscription = inscriptions.findById(inscriptionId)
                .orElseThrow(() -> new RessourceIntrouvableException("Réservation", inscriptionId));

        // Contrôle de propriété OWASP A01
        if (!inscription.getUtilisateurId().equals(utilisateurId)) {
            throw new AccessDeniedException("Vous n'êtes pas propriétaire de cette réservation");
        }

        // EF-25 : une réservation confirmée ne peut pas être annulée par le participant
        // (seule l'annulation de l'événement la fait passer à ANNULEE, RG-19)
        if (inscription.getStatut() == StatutInscription.CONFIRMEE) {
            throw new IllegalStateException("Une réservation confirmée ne peut plus être annulée (EF-25)");
        }
        inscription.transitionnerVers(StatutInscription.ANNULEE, "annulation_participant");
        inscriptions.save(inscription);

        // Libération de la place (RG-09)
        evenements.findById(inscription.getEvenementId()).ifPresent(e -> {
            e.libererPlace();
            evenements.save(e);
        });
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ROLE_PARTICIPANT')")
    public Page<ReservationResponse> mesReservations(Long utilisateurId, Pageable pageable) {
        return inscriptions.findByUtilisateurId(utilisateurId, pageable).map(this::versResponse);
    }

    private ReservationResponse versResponse(Inscription i) {
        var evt = serviceEvenement.consulter(i.getEvenementId());
        return new ReservationResponse(i.getId(), i.getStatut(), i.getCreeLe(), i.getExpireLe(),
                i.getMotifAnnulation(),
                i.getMontant() != null ? i.getMontant() : evt.prix(),
                i.getDevise() != null ? i.getDevise() : evt.devise(),
                evt);
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
        var expirees = new java.util.ArrayList<>(inscriptions.findByStatutAndExpireLeBefore(StatutInscription.EN_ATTENTE_PAIEMENT, LocalDateTime.now()));
        // Une réservation rejetée sans nouvelle référence avant l'échéance expire aussi (place libérée, RG-09)
        expirees.addAll(inscriptions.findByStatutAndExpireLeBefore(StatutInscription.REJETEE, LocalDateTime.now()));
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
