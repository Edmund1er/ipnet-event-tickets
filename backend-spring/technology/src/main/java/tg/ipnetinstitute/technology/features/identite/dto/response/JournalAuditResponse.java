package tg.ipnetinstitute.technology.features.identite.dto.response;

import java.time.LocalDateTime;

/** EF-51 : entrée du journal d'audit. acteurEmail est null pour une action système. */
public record JournalAuditResponse(
        Long id,
        Long acteurId,
        String acteurEmail,
        String action,
        String typeCible,
        String idCible,
        String details,
        LocalDateTime horodatage
) {}
