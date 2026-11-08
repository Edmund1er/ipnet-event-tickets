package tg.ipnetinstitute.technology.features.paiement.dto.request;

import jakarta.validation.constraints.NotBlank;

public record RejetPaiementRequest(
        @NotBlank(message = "Le motif de rejet est obligatoire")
        String motif
) {}
