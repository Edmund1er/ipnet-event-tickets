package tg.ipnetinstitute.technology.features.notification.application;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import tg.ipnetinstitute.technology.features.billet.application.BilletEmisEvent;
import tg.ipnetinstitute.technology.features.evenement.application.EvenementAnnuleEvent;
import tg.ipnetinstitute.technology.features.identite.domaine.Utilisateur;
import tg.ipnetinstitute.technology.features.identite.infrastructure.UtilisateurRepository;
import tg.ipnetinstitute.technology.features.notification.domaine.ModeCanal;
import tg.ipnetinstitute.technology.features.notification.domaine.ModeleNotification;
import tg.ipnetinstitute.technology.features.notification.domaine.OutboxNotification;
import tg.ipnetinstitute.technology.features.notification.infrastructure.OutboxNotificationRepository;
import tg.ipnetinstitute.technology.features.paiement.application.PaiementRejeteEvent;
import tg.ipnetinstitute.technology.features.reservation.domaine.Inscription;
import tg.ipnetinstitute.technology.features.reservation.infrastructure.InscriptionRepository;

import java.util.List;

/**
 * Listener découplé pour alimenter la table Outbox (Section 9.9).
 */
@Component
public class ListenerNotification {

    private final OutboxNotificationRepository outbox;
    private final InscriptionRepository inscriptions;
    private final UtilisateurRepository utilisateurs;

    public ListenerNotification(OutboxNotificationRepository outbox,
                                InscriptionRepository inscriptions,
                                UtilisateurRepository utilisateurs) {
        this.outbox = outbox;
        this.inscriptions = inscriptions;
        this.utilisateurs = utilisateurs;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void surBilletEmis(BilletEmisEvent e) {
        inscriptions.findById(e.inscriptionId()).ifPresent(i -> {
            utilisateurs.findById(i.getUtilisateurId()).ifPresent(u -> {
                String charge = "{\"billetId\":\"" + e.billetId() + "\",\"inscriptionId\":" + e.inscriptionId() + "}";
                OutboxNotification notification = OutboxNotification.creer(
                        ModeCanal.EMAIL,
                        u.getEmail(),
                        ModeleNotification.BILLET_EMIS,
                        charge
                );
                outbox.save(notification);
            });
        });
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void surPaiementRejete(PaiementRejeteEvent e) {
        inscriptions.findById(e.inscriptionId()).ifPresent(i -> {
            utilisateurs.findById(i.getUtilisateurId()).ifPresent(u -> {
                String charge = "{\"motif\":\"" + e.motif() + "\",\"inscriptionId\":" + e.inscriptionId() + "}";
                OutboxNotification notification = OutboxNotification.creer(
                        ModeCanal.EMAIL,
                        u.getEmail(),
                        ModeleNotification.PREUVE_REJETEE,
                        charge
                );
                outbox.save(notification);
            });
        });
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void surEvenementAnnule(EvenementAnnuleEvent e) {
        List<Inscription> inscriptionsEvt = inscriptions.findByEvenementIdAndStatutIn(
                e.evenementId(),
                List.of(
                        tg.ipnetinstitute.technology.features.reservation.domaine.StatutInscription.CONFIRMEE,
                        tg.ipnetinstitute.technology.features.reservation.domaine.StatutInscription.ANNULEE,
                        tg.ipnetinstitute.technology.features.reservation.domaine.StatutInscription.EN_ATTENTE_PAIEMENT,
                        tg.ipnetinstitute.technology.features.reservation.domaine.StatutInscription.PREUVE_ENVOYEE
                )
        );

        for (Inscription i : inscriptionsEvt) {
            utilisateurs.findById(i.getUtilisateurId()).ifPresent(u -> {
                String charge = "{\"evenementId\":" + e.evenementId() + ",\"motif\":\"" + (e.motif() != null ? e.motif() : "") + "\"}";
                OutboxNotification notification = OutboxNotification.creer(
                        ModeCanal.EMAIL,
                        u.getEmail(),
                        ModeleNotification.EVENEMENT_ANNULE,
                        charge
                );
                outbox.save(notification);
            });
        }
    }
}
