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
import java.util.Optional;

/**
 * Fournisseur de tokens JWT sécurisés (Section 5.1).
 * Access Token : durée 15 minutes.
 * Refresh Token : durée 7 jours avec rotation stricte.
 * Jeton de réinitialisation du mot de passe : 30 minutes, usage unique
 * (lié à l'empreinte du hash courant : il devient invalide dès que le mot de passe change).
 * Le claim "type" empêche d'utiliser un type de jeton à la place d'un autre.
 */
@Component
public class JwtWrapper {

    public static final String TYPE_ACCESS = "ACCESS";
    public static final String TYPE_REFRESH = "REFRESH";
    public static final String TYPE_RESET = "RESET";

    private final SecretKey key;
    private final long accessValidityMs = 15 * 60 * 1000; // 15 min
    private final long refreshValidityMs = 7 * 24 * 60 * 60 * 1000L; // 7 jours
    private final long resetValidityMs = 30 * 60 * 1000; // 30 min

    public JwtWrapper(@Value("${app.security.jwt.secret:ipnet_billetterie_jwt_secret_key_minimum_256_bits_length_for_hmac_sha256!}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public long dureeAccessSecondes() {
        return accessValidityMs / 1000;
    }

    public long dureeRefreshSecondes() {
        return refreshValidityMs / 1000;
    }

    public String genererAccessToken(Long utilisateurId, String email, Role role, boolean emailVerifie) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(utilisateurId))
                .claim("type", TYPE_ACCESS)
                .claim("email", email)
                .claim("role", "ROLE_" + role.name())
                .claim("ev", emailVerifie)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + accessValidityMs))
                .signWith(key)
                .compact();
    }

    public String genererRefreshToken(Long utilisateurId) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(utilisateurId))
                .claim("type", TYPE_REFRESH)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + refreshValidityMs))
                .signWith(key)
                .compact();
    }

    public String genererJetonReinitialisation(Long utilisateurId, String empreinteMotDePasse) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(utilisateurId))
                .claim("type", TYPE_RESET)
                .claim("empreinte", empreinteMotDePasse)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + resetValidityMs))
                .signWith(key)
                .compact();
    }

    public boolean validerToken(String token) {
        return lire(token).isPresent();
    }

    /** Jeton d'accès valide : signature, expiration, rôle présent et type ACCESS. */
    public boolean estAccessTokenValide(String token) {
        return lire(token)
                .filter(c -> TYPE_ACCESS.equals(c.get("type", String.class)))
                .filter(c -> c.get("role", String.class) != null)
                .isPresent();
    }

    /** Claims d'un jeton valide du type attendu, sinon vide. */
    public Optional<Claims> lireJetonDeType(String token, String typeAttendu) {
        return lire(token).filter(c -> typeAttendu.equals(c.get("type", String.class)));
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

    /** RG-01 : un compte dont l'e-mail n'est pas vérifié n'obtient pas les droits de son rôle. */
    public boolean extraireEmailVerifie(String token) {
        return Boolean.TRUE.equals(extraireClaims(token).get("ev", Boolean.class));
    }

    private Optional<Claims> lire(String token) {
        if (token == null || token.isBlank()) return Optional.empty();
        try {
            return Optional.of(extraireClaims(token));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
