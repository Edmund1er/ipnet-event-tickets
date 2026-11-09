package tg.ipnetinstitute.technology.features.paiement.dto.response;

import tg.ipnetinstitute.technology.features.paiement.model.StatutPaiement;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * EF-22 : ligne de la file de traitement des paiements (vue administrateur).
 * aCapture indique si une capture est jointe ; elle se télécharge via
 * GET /api/admin/paiements/{id}/preuve (le chemin de stockage n'est jamais exposé).
 */
public record PaiementAdminResponse(
        Long id,
        Long inscriptionId,
        String referenceOperateur,
        BigDecimal montant,
        String devise,
        boolean aCapture,
        StatutPaiement statut,
        LocalDateTime valideLe,
        boolean valideAutomatiquement,
        String motifRejet,
        Long evenementId,
        String evenementTitre,
        Long participantId,
        String participantNom,
        String participantPrenom,
        String participantEmail
) {}
