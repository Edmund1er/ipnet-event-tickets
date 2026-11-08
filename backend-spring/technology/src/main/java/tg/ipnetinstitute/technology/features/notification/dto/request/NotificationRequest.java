package tg.ipnetinstitute.technology.features.notification.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import tg.ipnetinstitute.technology.features.notification.model.ModeCanal;
import tg.ipnetinstitute.technology.features.notification.model.ModeleNotification;

public record NotificationRequest(
        @NotNull(message = "Le canal est obligatoire")
        ModeCanal canal,

        @NotBlank(message = "Le destinataire est obligatoire")
        String destinataire,

        @NotNull(message = "Le modèle de notification est obligatoire")
        ModeleNotification modele,

        String donneesPayload
) {}
