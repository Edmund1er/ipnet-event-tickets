package tg.ipnetinstitute.technology.config;
import tg.ipnetinstitute.technology.features.identite.wrapper.JwtWrapper;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * Filtre d'authentification par JWT d'accès.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtWrapper jwtProvider;

    public JwtAuthenticationFilter(JwtWrapper jwtProvider) {
        this.jwtProvider = jwtProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String token = extraireJeton(request);

        if (token != null) {
            if (jwtProvider.estAccessTokenValide(token)) {
                Long userId = jwtProvider.extraireUtilisateurId(token);
                // Tant que l'adresse e-mail n'est pas vérifiée, seul le profil et la vérification sont accessibles
                String role = jwtProvider.extraireEmailVerifie(token) ? jwtProvider.extraireRole(token) : "ROLE_NON_VERIFIE";

                if (userId != null && role != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    var authorities = Collections.singletonList(new SimpleGrantedAuthority(role));
                    var authToken = new UsernamePasswordAuthenticationToken(userId, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Jeton lu dans l'en-tête Authorization. Exception unique : le flux SSE de scan
     * (/api/scan/evenements/{id}/flux), car l'EventSource du navigateur ne peut pas
     * envoyer d'en-tête ; le jeton d'accès (15 min) y est accepté en paramètre access_token.
     */
    private String extraireJeton(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        String uri = request.getRequestURI();
        if ("GET".equals(request.getMethod()) && uri.startsWith("/api/scan/evenements/") && uri.endsWith("/flux")) {
            String parametre = request.getParameter("access_token");
            if (parametre != null && !parametre.isBlank()) {
                return parametre;
            }
        }
        return null;
    }
}
