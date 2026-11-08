package tg.ipnetinstitute.technology.features.billet.wrapper;

import java.util.Optional;
import java.util.UUID;

/**
 * Strategy pour la signature cryptographique du jeton QR (Section 9.7).
 * HMAC-SHA256 aujourd'hui ; asymétrique RSA/Ed25519 possible par extension.
 */
public interface HmacWrapper {
    String signer(UUID billetId, String nonce, Long evenementId);
    Optional<UUID> verifier(String jeton, Long evenementId, String nonce);
}
