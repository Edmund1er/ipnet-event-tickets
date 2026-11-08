package tg.ipnetinstitute.technology.features.paiement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SoumissionPreuveRequest(
        @NotNull(message = "L'identifiant de la réservation est obligatoire")
        Long inscriptionId,

        @NotBlank(message = "La référence opérateur est obligatoire")
        String referenceOperateur
) {}
