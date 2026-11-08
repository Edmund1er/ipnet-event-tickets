package tg.ipnetinstitute.technology.features.notification.dto.response;

import tg.ipnetinstitute.technology.features.notification.model.ModeCanal;
import tg.ipnetinstitute.technology.features.notification.model.ModeleNotification;
import tg.ipnetinstitute.technology.features.notification.model.StatutOutbox;
import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        ModeCanal canal,
        String destinataire,
        ModeleNotification modele,
        StatutOutbox statut,
        int tentatives,
        LocalDateTime creeLe
) {}
