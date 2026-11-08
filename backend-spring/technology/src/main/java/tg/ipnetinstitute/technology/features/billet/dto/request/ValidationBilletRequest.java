package tg.ipnetinstitute.technology.features.billet.dto.request;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ValidationBilletRequest(
        @NotNull(message = "L'identifiant du billet est obligatoire")
        UUID billetId
) {}
