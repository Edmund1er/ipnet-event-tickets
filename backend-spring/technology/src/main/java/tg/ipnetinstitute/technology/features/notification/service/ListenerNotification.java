package tg.ipnetinstitute.technology.features.notification.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import tg.ipnetinstitute.technology.features.billet.service.BilletEmisEvent;
import tg.ipnetinstitute.technology.features.evenement.service.EvenementAnnuleEvent;
import tg.ipnetinstitute.technology.features.evenement.service.ServiceEvenement;
import tg.ipnetinstitute.technology.features.identite.service.OtpGenereEvent;
import tg.ipnetinstitute.technology.features.identite.service.ReinitialisationMotDePasseDemandeeEvent;
import tg.ipnetinstitute.technology.features.identite.service.ServiceIdentite;
import tg.ipnetinstitute.technology.features.notification.model.ModeCanal;
import tg.ipnetinstitute.technology.features.notification.model.ModeleNotification;
import tg.ipnetinstitute.technology.features.notification.model.OutboxNotification;
import tg.ipnetinstitute.technology.features.notification.repository.OutboxNotificationRepository;
import tg.ipnetinstitute.technology.features.paiement.model.StatutPaiement;
import tg.ipnetinstitute.technology.features.paiement.repository.PaiementRepository;
import tg.ipnetinstitute.technology.features.paiement.service.PaiementRejeteEvent;
import tg.ipnetinstitute.technology.features.reservation.model.Inscription;
import tg.ipnetinstitute.technology.features.reservation.model.StatutInscription;
import tg.ipnetinstitute.technology.features.reservation.repository.InscriptionRepository;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Alimente l'outbox (Transactional Outbox, §6 Fiabilité) après le commit du fait métier.
 * AFTER_COMMIT : la transaction d'origine est close, l'écriture se fait dans une nouvelle transaction.
 * RG-20 : le destinataire est l'adresse e-mail courante du compte au moment de l'émission.
 */
@Component
public class ListenerNotification {

    private final OutboxNotificationRepository outbox;
    private final InscriptionRepository inscriptions;
    private final PaiementRepository paiements;
    private final ServiceIdentite serviceIdentite;
    private final ServiceEvenement serviceEvenement;
    private final ObjectMapper objectMapper;

    public ListenerNotification(OutboxNotificationRepository outbox,
                                InscriptionRepository inscriptions,
                                PaiementRepository paiements,
                                ServiceIdentite serviceIdentite,
                                ServiceEvenement serviceEvenement,
                                ObjectMapper objectMapper) {
        this.outbox = outbox;
        this.inscriptions = inscriptions;
        this.paiements = paiements;
        this.serviceIdentite = serviceIdentite;
        this.serviceEvenement = serviceEvenement;
        this.objectMapper = objectMapper;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void surOtpGenere(OtpGenereEvent e) {
        enregistrer(e.email(), ModeleNotification.OTP, Map.of("code", e.code()));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void surBilletEmis(BilletEmisEvent e) {
        inscriptions.findById(e.inscriptionId()).ifPresent(i ->
                serviceIdentite.emailDe(i.getUtilisateurId()).ifPresent(email ->
                        enregistrer(email, ModeleNotification.BILLET_EMIS, Map.of("billetId", e.billetId().toString()))));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void surPaiementRejete(PaiementRejeteEvent e) {
        inscriptions.findById(e.inscriptionId()).ifPresent(i -> {
            var evt = serviceEvenement.consulter(i.getEvenementId());
            serviceIdentite.emailDe(i.getUtilisateurId()).ifPresent(email ->
                    enregistrer(email, ModeleNotification.PREUVE_REJETEE, Map.of(
                            "evenementTitre", evt.titre(),
                            "motif", e.motif() == null ? "" : e.motif())));
        });
    }

    /** EF-14 / RG-19 : un e-mail par participant dont la réservation a été annulée par l'annulation de l'événement. */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void surEvenementAnnule(EvenementAnnuleEvent e) {
        var evt = serviceEvenement.consulter(e.evenementId());
        List<Inscription> concernees = inscriptions.findByEvenementIdAndStatutIn(e.evenementId(), List.of(StatutInscription.ANNULEE))
                .stream()
                .filter(i -> "evenement_annule".equals(i.getMotifAnnulation()))
                .toList();

        for (Inscription i : concernees) {
            boolean aRembourser = paiements.findByInscriptionId(i.getId())
                    .map(p -> p.getStatut() == StatutPaiement.A_REMBOURSER)
                    .orElse(false);
            serviceIdentite.emailDe(i.getUtilisateurId()).ifPresent(email -> {
                Map<String, Object> charge = new LinkedHashMap<>();
                charge.put("evenementTitre", evt.titre());
                charge.put("dateDebut", evt.dateDebut().toString());
                charge.put("motif", e.motif() == null ? "" : e.motif());
                charge.put("aRembourser", aRembourser);
                enregistrer(email, ModeleNotification.EVENEMENT_ANNULE, charge);
            });
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void surReinitialisationDemandee(ReinitialisationMotDePasseDemandeeEvent e) {
        enregistrer(e.email(), ModeleNotification.RESET_MOT_DE_PASSE, Map.of("lien", e.lien()));
    }

    private void enregistrer(String destinataire, ModeleNotification modele, Map<String, ?> charge) {
        try {
            outbox.save(OutboxNotification.creer(ModeCanal.EMAIL, destinataire, modele, objectMapper.writeValueAsString(charge)));
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Sérialisation de la notification impossible", ex);
        }
    }
}
