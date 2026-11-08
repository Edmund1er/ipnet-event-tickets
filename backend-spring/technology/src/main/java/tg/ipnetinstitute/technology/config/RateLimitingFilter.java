package tg.ipnetinstitute.technology.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Limitation de débit (Rate Limiting avec Bucket4j) selon Section 5.3 :
 * inscription, envoi d'OTP, connexion, scan.
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private Bucket creerBucket(String route) {
        // Paramétrage selon sensibilité de la route
        if (route.contains("/otp") || route.contains("/connexion")) {
            // Max 10 requêtes par minute
            Refill refill = Refill.greedy(10, Duration.ofMinutes(1));
            Bandwidth limit = Bandwidth.classic(10, refill);
            return Bucket.builder().addLimit(limit).build();
        } else if (route.contains("/scan")) {
            // Scanner : cadence autorisée jusqu'à 60 requêtes par minute
            Refill refill = Refill.greedy(60, Duration.ofMinutes(1));
            Bandwidth limit = Bandwidth.classic(60, refill);
            return Bucket.builder().addLimit(limit).build();
        } else {
            // Routes d'inscription ou publiques : 20 requêtes par minute
            Refill refill = Refill.greedy(20, Duration.ofMinutes(1));
            Bandwidth limit = Bandwidth.classic(20, refill);
            return Bucket.builder().addLimit(limit).build();
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String uri = request.getRequestURI();

        // Appliquer uniquement sur les routes sensibles
        if (uri.startsWith("/api/auth/") || uri.startsWith("/api/scan")) {
            String ip = request.getRemoteAddr();
            String cle = ip + ":" + uri;

            Bucket bucket = buckets.computeIfAbsent(cle, k -> creerBucket(uri));

            if (!bucket.tryConsume(1)) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/problem+json");
                response.getWriter().write("""
                    {
                      "type": "https://billetterie.ipnetinstitute.tg/erreurs/rate-limit",
                      "title": "Limite de requêtes atteinte",
                      "status": 429,
                      "detail": "Trop de requêtes effectuées. Veuillez patienter avant de réessayer."
                    }
                    """);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
