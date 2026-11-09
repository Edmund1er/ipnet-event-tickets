package tg.ipnetinstitute.technology.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import tg.ipnetinstitute.technology.common.exception.GlobalExceptionHandler;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

/**
 * Configuration Spring Security avec règles OWASP strictes :
 * - HSTS, CSP, X-Frame-Options, X-Content-Type-Options
 * - Protection par rôles (@EnableMethodSecurity)
 * - Filtres Rate Limiting et JWT
 * - BCrypt force 12 (Section 5.1)
 * - 401 (non authentifié) et 403 (droits insuffisants) au format RFC 9457
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfiguration {

    private final JwtAuthenticationFilter jwtFilter;
    private final RateLimitingFilter rateLimitingFilter;
    private final ObjectMapper objectMapper;
    private final List<String> originesAutorisees;

    public SecurityConfiguration(JwtAuthenticationFilter jwtFilter,
                                 RateLimitingFilter rateLimitingFilter,
                                 ObjectMapper objectMapper,
                                 @Value("${app.cors.origines:http://localhost:5173}") String origines) {
        this.jwtFilter = jwtFilter;
        this.rateLimitingFilter = rateLimitingFilter;
        this.objectMapper = objectMapper;
        this.originesAutorisees = Arrays.stream(origines.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable) // API REST stateless protégée par JWT ; cookie refresh en SameSite=Strict
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(headers -> headers
                .contentTypeOptions(contentType -> {})
                .frameOptions(frame -> frame.deny())
                .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31536000))
                .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'; object-src 'none';"))
                .referrerPolicy(referrer -> referrer.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, e) -> ecrire(response,
                        GlobalExceptionHandler.probleme(HttpStatus.UNAUTHORIZED, "non-authentifie",
                                "Authentification requise",
                                "Vous devez être connecté pour accéder à cette ressource.", "NON_AUTHENTIFIE")))
                .accessDeniedHandler((request, response, e) -> ecrire(response,
                        GlobalExceptionHandler.probleme(HttpStatus.FORBIDDEN, "acces-refuse", "Accès interdit",
                                "Accès refusé : privilèges insuffisants", "ACCES_REFUSE")))
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Authentification publique
                .requestMatchers(HttpMethod.POST,
                    "/api/auth/inscription",
                    "/api/auth/inscription/verification",
                    "/api/auth/inscription/renvoi",
                    "/api/auth/connexion",
                    "/api/auth/rafraichir",
                    "/api/auth/deconnexion",
                    "/api/auth/mot-de-passe/oubli",
                    "/api/auth/mot-de-passe/reinitialisation",
                    "/api/installation"
                ).permitAll()
                // Consultation publique
                .requestMatchers(HttpMethod.GET,
                    "/api/evenements",
                    "/api/evenements/*",
                    "/api/evenements/*/image",
                    "/api/referentiels/**",
                    "/api/installation"
                ).permitAll()
                // Documentation
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                // Zones protégées par rôle (contrôle doublé par @PreAuthorize dans les services)
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/scan/**").hasAnyRole("SCANNER", "ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private void ecrire(HttpServletResponse response, ProblemDetail probleme) throws IOException {
        response.setStatus(probleme.getStatus());
        response.setContentType("application/problem+json");
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(), probleme);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(originesAutorisees); // Origine(s) du frontend React (app.cors.origines)
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        config.setExposedHeaders(List.of("Content-Disposition"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
