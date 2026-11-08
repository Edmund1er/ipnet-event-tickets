package tg.ipnetinstitute.technology.features.notification.service;
import tg.ipnetinstitute.technology.features.notification.wrapper.CanalNotification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tg.ipnetinstitute.technology.features.notification.model.ModeCanal;
import tg.ipnetinstitute.technology.features.notification.model.OutboxNotification;
import tg.ipnetinstitute.technology.features.notification.model.StatutOutbox;
import tg.ipnetinstitute.technology.features.notification.repository.OutboxNotificationRepository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Traitement asynchrone périodique de l'Outbox avec réessais automatiques (Section 9.9).
 */
@Component
public class DispatcheurOutbox {

    private static final Logger log = LoggerFactory.getLogger(DispatcheurOutbox.class);
    private final OutboxNotificationRepository outbox;
    private final Map<ModeCanal, CanalNotification> canaux;

    public DispatcheurOutbox(OutboxNotificationRepository outbox, List<CanalNotification> canalList) {
        this.outbox = outbox;
        this.canaux = canalList.stream().collect(Collectors.toMap(CanalNotification::canal, c -> c));
    }

    @Scheduled(fixedDelay = 10_000)
    @Transactional
    public void traiterEnAttente() {
        List<OutboxNotification> enAttente = outbox.findTop20ByStatutOrderByCreeLeAsc(StatutOutbox.EN_ATTENTE);
        if (enAttente.isEmpty()) return;

        for (OutboxNotification notif : enAttente) {
            CanalNotification canal = canaux.get(notif.getCanal());
            if (canal != null) {
                try {
                    String titre = switch (notif.getModele()) {
                        case BILLET_EMIS -> "Votre billet IPNET est disponible";
                        case PREUVE_REJETEE -> "Information concernant votre preuve de paiement";
                        case EVENEMENT_ANNULE -> "Annulation d'événement";
                        case OTP -> "Votre code de validation";
                        case RESET_MOT_DE_PASSE -> "Réinitialisation de mot de passe";
                    };

                    canal.envoyer(notif.getDestinataire(), titre, "Détail : " + notif.getCharge());
                    notif.marquerSucces();
                } catch (Exception e) {
                    log.error("Échec d'envoi de la notification outbox id={}", notif.getId(), e);
                    notif.marquerEchec();
                }
                outbox.save(notif);
            }
        }
    }
}
