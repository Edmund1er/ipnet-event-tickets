package tg.ipnetinstitute.technology.features.notification.infrastructure;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import tg.ipnetinstitute.technology.features.notification.application.CanalNotification;
import tg.ipnetinstitute.technology.features.notification.domaine.ModeCanal;

/**
 * Implémentation canal SMS (sandbox / sans surcoût pour V1, RG-02).
 */
@Component
public class CanalSms implements CanalNotification {

    private static final Logger log = LoggerFactory.getLogger(CanalSms.class);

    @Override
    public ModeCanal canal() {
        return ModeCanal.SMS;
    }

    @Override
    public void envoyer(String destinataire, String titre, String corps) {
        log.info("[SIMULATION SMS RG-02] Destination: {}, Message: {}", destinataire, corps);
    }
}
