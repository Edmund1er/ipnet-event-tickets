package tg.ipnetinstitute.technology.features.notification.dto.response;

import tg.ipnetinstitute.technology.features.notification.model.ModeCanal;
import tg.ipnetinstitute.technology.features.notification.model.ModeleNotification;
import tg.ipnetinstitute.technology.features.notification.model.StatutOutbox;

import java.time.LocalDateTime;

/** Suivi de l'outbox par l'administrateur (la charge, qui peut contenir un code OTP, n'est pas exposée). */
public record NotificationResponse(
        Long id,
        ModeCanal canal,
        String destinataire,
        ModeleNotification modele,
        StatutOutbox statut,
        int tentatives,
        String derniereErreur,
        LocalDateTime creeLe
) {}
