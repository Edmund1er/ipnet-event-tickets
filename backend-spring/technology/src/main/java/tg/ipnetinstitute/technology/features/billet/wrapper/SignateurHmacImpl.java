package tg.ipnetinstitute.technology.features.billet.wrapper;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

/**
 * Implémentation HMAC-SHA256 (RG-12, Section 5.4).
 * Comparaison à temps constant contre les attaques par canal auxiliaire (timing attacks).
 */
@Component
public class SignateurHmacImpl implements HmacWrapper {

    private final byte[] secretKey;

    public SignateurHmacImpl(@Value("${app.security.qr.hmac-secret:}") String secret, Environment environment) {
        String valeur = secret == null ? "" : secret.trim();
        boolean production = Arrays.stream(environment.getActiveProfiles())
                .anyMatch(profil -> profil.equalsIgnoreCase("prod") || profil.equalsIgnoreCase("production"));
        if (valeur.isEmpty()) {
            if (production) {
                throw new IllegalStateException("QR_HMAC_SECRET doit être configuré en production.");
            }
            byte[] aleatoire = new byte[32];
            new SecureRandom().nextBytes(aleatoire);
            this.secretKey = aleatoire;
            return;
        }
        byte[] cle = valeur.getBytes(StandardCharsets.UTF_8);
        if (cle.length < 32) {
            throw new IllegalStateException("QR_HMAC_SECRET doit contenir au moins 32 octets.");
        }
        this.secretKey = cle;
    }

    @Override
    public String signer(UUID billetId, String nonce, Long evenementId) {
        try {
            String charge = billetId.toString() + "|" + evenementId + "|" + nonce;
            Mac hmac = Mac.getInstance("HmacSHA256");
            hmac.init(new SecretKeySpec(secretKey, "HmacSHA256"));
            byte[] signature = hmac.doFinal(charge.getBytes(StandardCharsets.UTF_8));

            String jetonBrut = billetId.toString() + "." + Base64.getUrlEncoder().withoutPadding().encodeToString(signature);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(jetonBrut.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new RuntimeException("Erreur de signature HMAC du jeton billet", e);
        }
    }

    @Override
    public Optional<UUID> verifier(String jeton, Long evenementId, String nonce) {
        try {
            String jetonDecode = new String(Base64.getUrlDecoder().decode(jeton), StandardCharsets.UTF_8);
            String[] parts = jetonDecode.split("\\.");
            if (parts.length != 2) return Optional.empty();

            UUID billetId = UUID.fromString(parts[0]);
            byte[] signatureRecue = Base64.getUrlDecoder().decode(parts[1]);

            String charge = billetId.toString() + "|" + evenementId + "|" + nonce;
            Mac hmac = Mac.getInstance("HmacSHA256");
            hmac.init(new SecretKeySpec(secretKey, "HmacSHA256"));
            byte[] signatureCalculee = hmac.doFinal(charge.getBytes(StandardCharsets.UTF_8));

            // Comparaison en temps constant (OWASP A02 Cryptographic Failures)
            if (MessageDigest.isEqual(signatureRecue, signatureCalculee)) {
                return Optional.of(billetId);
            }
            return Optional.empty();
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
