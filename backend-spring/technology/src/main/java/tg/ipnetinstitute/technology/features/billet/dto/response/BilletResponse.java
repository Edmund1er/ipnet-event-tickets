package tg.ipnetinstitute.technology.features.billet.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * EF-32 : billet affiché au participant (événement, date, lieu, porteur).
 * L'image du QR code est servie séparément par GET /api/billets/{id}/qr.
 * Le nonce et le jeton signé ne sont jamais exposés ici.
 */
public record BilletResponse(
        UUID id,
        Long inscriptionId,
        Long evenementId,
        String evenementTitre,
        LocalDateTime evenementDate,
        String evenementLieu,
        String porteurNom,
        String porteurPrenom,
        LocalDateTime scanneLe,
        boolean invalide
) {}
