package tg.ipnetinstitute.technology.features.identite.wrapper;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tg.ipnetinstitute.technology.features.identite.model.Role;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Fournisseur de tokens JWT sécurisés (Section 5.1).
 * Access Token : durée 15 minutes.
 * Refresh Token : durée 7 jours avec rotation stricte.
 */
@Component
public class JwtWrapper {

    private final SecretKey key;
    private final long accessValidityMs = 15 * 60 * 1000; // 15 min
    private final long refreshValidityMs = 7 * 24 * 60 * 60 * 1000L; // 7 jours

    public JwtWrapper(@Value("${app.security.jwt.secret:ipnet_billetterie_jwt_secret_key_minimum_256_bits_length_for_hmac_sha256!}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String genererAccessToken(Long utilisateurId, String email, Role role) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + accessValidityMs);

        return Jwts.builder()
                .subject(String.valueOf(utilisateurId))
                .claim("email", email)
                .claim("role", "ROLE_" + role.name())
                .issuedAt(now)
                .expiration(expiration)
                .signWith(key)
                .compact();
    }

    public String genererRefreshToken(Long utilisateurId) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + refreshValidityMs);

        return Jwts.builder()
                .subject(String.valueOf(utilisateurId))
                .claim("type", "REFRESH")
                .issuedAt(now)
                .expiration(expiration)
                .signWith(key)
                .compact();
    }

    public boolean validerToken(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public Claims extraireClaims(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }

    public Long extraireUtilisateurId(String token) {
        return Long.parseLong(extraireClaims(token).getSubject());
    }

    public String extraireRole(String token) {
        return extraireClaims(token).get("role", String.class);
    }
}
