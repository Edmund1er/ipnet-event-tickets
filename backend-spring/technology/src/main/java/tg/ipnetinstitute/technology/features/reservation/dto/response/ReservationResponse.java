package tg.ipnetinstitute.technology.features.reservation.dto.response;

import tg.ipnetinstitute.technology.features.evenement.dto.response.EvenementResume;
import tg.ipnetinstitute.technology.features.reservation.model.StatutInscription;

import java.time.LocalDateTime;

/**
 * Réservation vue par son propriétaire. "motif" porte le motif de rejet du paiement (REJETEE)
 * ou d'annulation (ANNULEE, EXPIREE). montant / devise : somme due figée à la réservation (RG-17).
 */
public record ReservationResponse(
        Long id,
        StatutInscription statut,
        LocalDateTime creeLe,
        LocalDateTime expireLe,
        String motif,
        java.math.BigDecimal montant,
        String devise,
        EvenementResume evenement
) {}
