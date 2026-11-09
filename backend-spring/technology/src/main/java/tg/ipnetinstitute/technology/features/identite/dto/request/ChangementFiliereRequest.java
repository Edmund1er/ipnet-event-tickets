package tg.ipnetinstitute.technology.features.identite.dto.request;

import jakarta.validation.constraints.NotNull;

public record ChangementFiliereRequest(
        @NotNull(message = "La nouvelle filière est obligatoire") Long nouvelleFiliereId
) {}
