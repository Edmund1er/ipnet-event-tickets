package tg.ipnetinstitute.technology.features.reservation.dto.response;

import tg.ipnetinstitute.technology.features.reservation.model.StatutInscription;
import java.time.LocalDateTime;

public record ReservationResponse(
        Long id,
        Long utilisateurId,
        Long evenementId,
        StatutInscription statut,
        LocalDateTime creeLe,
        LocalDateTime expireLe,
        String motifAnnulation
) {}
