package tg.ipnetinstitute.technology.features.controle.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** EF-40 : jeton lu dans le QR code (caméra ou saisie manuelle) et événement en cours. */
public record ScanRequest(
        @NotBlank(message = "Le jeton est obligatoire") String jeton,
        @NotNull(message = "L'événement est obligatoire") Long evenementId
) {}
