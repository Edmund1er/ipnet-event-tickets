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
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtProvider.validerToken(token)) {
                Long userId = jwtProvider.extraireUtilisateurId(token);
                String role = jwtProvider.extraireRole(token);

                if (userId != null && role != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    var authorities = Collections.singletonList(new SimpleGrantedAuthority(role));
                    var authToken = new UsernamePasswordAuthenticationToken(userId, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
