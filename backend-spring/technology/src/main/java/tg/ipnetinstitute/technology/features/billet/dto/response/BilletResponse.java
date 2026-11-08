package tg.ipnetinstitute.technology.features.billet.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record BilletResponse(
        UUID id,
        Long inscriptionId,
        LocalDateTime scanneLe,
        boolean invalide
) {}
