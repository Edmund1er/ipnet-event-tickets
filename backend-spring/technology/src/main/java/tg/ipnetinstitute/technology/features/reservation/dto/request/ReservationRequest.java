package tg.ipnetinstitute.technology.features.reservation.dto.request;

import jakarta.validation.constraints.NotNull;

public record ReservationRequest(
        @NotNull(message = "L'identifiant de l'événement est obligatoire")
        Long evenementId
) {}
