package tg.ipnetinstitute.technology.features.paiement.dto.response;

import tg.ipnetinstitute.technology.features.paiement.model.StatutPaiement;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaiementResponse(
        Long id,
        Long inscriptionId,
        String referenceOperateur,
        BigDecimal montant,
        String devise,
        String cheminPreuve,
        StatutPaiement statut,
        LocalDateTime valideLe,
        String motifRejet
) {}
