package tg.ipnetinstitute.technology.features.identite.dto.response;

import java.time.LocalDateTime;

public record AgentScanResponse(
        Long id,
        String email,
        boolean emailVerifie,
        String telephone,
        boolean actif,
        LocalDateTime creeLe
) {}
