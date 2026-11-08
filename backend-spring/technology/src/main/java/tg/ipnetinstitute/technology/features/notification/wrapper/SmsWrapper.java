package tg.ipnetinstitute.technology.features.notification.wrapper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import tg.ipnetinstitute.technology.features.notification.model.ModeCanal;

/**
 * Implémentation canal SMS (sandbox / sans surcoût pour V1, RG-02).
 */
@Component
public class SmsWrapper implements CanalNotification {

    private static final Logger log = LoggerFactory.getLogger(SmsWrapper.class);

    @Override
    public ModeCanal canal() {
        return ModeCanal.SMS;
    }

    @Override
    public void envoyer(String destinataire, String titre, String corps) {
        log.info("[SIMULATION SMS RG-02] Destination: {}, Message: {}", destinataire, corps);
    }
}
