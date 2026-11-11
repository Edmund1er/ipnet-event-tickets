package tg.ipnetinstitute.technology.features.identite.controller;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tg.ipnetinstitute.technology.common.utils.Email;
import tg.ipnetinstitute.technology.features.identite.dto.request.*;
import tg.ipnetinstitute.technology.features.identite.dto.response.ReponseInscription;
import tg.ipnetinstitute.technology.features.identite.dto.response.SessionResponse;
import tg.ipnetinstitute.technology.features.identite.dto.response.TokensAcces;
import tg.ipnetinstitute.technology.features.identite.service.ServiceAuthentification;
import tg.ipnetinstitute.technology.features.identite.service.ServiceInscription;
import tg.ipnetinstitute.technology.features.identite.service.ServiceVerificationEmail;
import tg.ipnetinstitute.technology.features.identite.wrapper.JwtWrapper;

import java.time.Duration;
import java.util.Map;

/**
 * Authentification (EF-01 à EF-06, Section 5.1).
 * Le refresh token circule uniquement en cookie HttpOnly, Secure, SameSite=Strict, limité à /api/auth.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String COOKIE_REFRESH = "refreshToken";
    private static final String CHEMIN_COOKIE = "/api/auth";

    private final ServiceInscription serviceInscription;
    private final ServiceVerificationEmail serviceVerificationEmail;
    private final ServiceAuthentification serviceAuthentification;
    private final JwtWrapper jwtWrapper;
    private final boolean cookieSecure;

    public AuthController(ServiceInscription serviceInscription,
                          ServiceVerificationEmail serviceVerificationEmail,
                          ServiceAuthentification serviceAuthentification,
                          JwtWrapper jwtWrapper,
                          @Value("${app.security.cookie.secure:true}") boolean cookieSecure) {
        this.serviceInscription = serviceInscription;
        this.serviceVerificationEmail = serviceVerificationEmail;
        this.serviceAuthentification = serviceAuthentification;
        this.jwtWrapper = jwtWrapper;
        this.cookieSecure = cookieSecure;
    }

    /**
     * Étape 1 : enregistre la demande et envoie le code par e-mail. Aucun compte n'est créé,
     * aucune session n'est ouverte : l'accès n'est possible qu'après validation du code.
     */
    @PostMapping("/inscription")
    public ResponseEntity<ReponseInscription> inscrire(@Valid @RequestBody DemandeInscription demande) {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(serviceInscription.demander(demande));
    }

    /** Étape 2 : le code est correct, le compte est créé et la session ouverte. */
    @PostMapping("/inscription/verification")
    public ResponseEntity<SessionResponse> confirmerInscription(@Valid @RequestBody VerificationInscriptionRequest body,
                                                                HttpServletResponse response) {
        Long utilisateurId = serviceInscription.confirmer(body.email(), body.code());
        TokensAcces tokens = serviceAuthentification.ouvrirSession(utilisateurId);
        poserCookieRefresh(response, tokens.refreshToken());
        return ResponseEntity.status(HttpStatus.CREATED).body(tokens.versSession());
    }

    @PostMapping("/inscription/renvoi")
    public ResponseEntity<ReponseInscription> renvoyerCodeInscription(@Valid @RequestBody RenvoiCodeRequest body) {
        return ResponseEntity.ok(serviceInscription.renvoyer(body.email()));
    }

    @PostMapping("/otp/envoi")
    public ResponseEntity<Map<String, String>> renvoyerOtp(@AuthenticationPrincipal Long utilisateurId) {
        serviceVerificationEmail.envoyerCode(utilisateurId);
        return ResponseEntity.ok(Map.of("message", "Un nouveau code a été envoyé à votre adresse e-mail."));
    }

    /** Confirme l'adresse e-mail et renvoie une session portant les droits du rôle. */
    @PostMapping("/otp/verification")
    public ResponseEntity<SessionResponse> verifierOtp(@AuthenticationPrincipal Long utilisateurId,
                                                       @Valid @RequestBody VerificationOtpRequest body,
                                                       HttpServletResponse response) {
        serviceVerificationEmail.verifier(utilisateurId, body.code());
        TokensAcces tokens = serviceAuthentification.ouvrirSession(utilisateurId);
        poserCookieRefresh(response, tokens.refreshToken());
        return ResponseEntity.ok(tokens.versSession());
    }

    @PostMapping("/connexion")
    public ResponseEntity<SessionResponse> connecter(@Valid @RequestBody ConnexionRequest body,
                                                     HttpServletResponse response) {
        TokensAcces tokens = serviceAuthentification.connecter(new Email(body.email()), body.motDePasse());
        poserCookieRefresh(response, tokens.refreshToken());
        return ResponseEntity.ok(tokens.versSession());
    }

    @PostMapping("/rafraichir")
    public ResponseEntity<SessionResponse> rafraichir(@CookieValue(name = COOKIE_REFRESH, required = false) String refreshToken,
                                                      HttpServletResponse response) {
        // Visiteur non connecté : pas de session à restaurer, réponse vide (et non une erreur)
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.noContent().build();
        }
        TokensAcces tokens = serviceAuthentification.rafraichir(refreshToken);
        poserCookieRefresh(response, tokens.refreshToken());
        return ResponseEntity.ok(tokens.versSession());
    }

    /** Supprime le cookie de rafraîchissement ; le front oublie le jeton d'accès (15 min max). */
    @PostMapping("/deconnexion")
    public ResponseEntity<Void> deconnecter(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, cookie("", Duration.ZERO).toString());
        return ResponseEntity.noContent().build();
    }

    /** EF-06 : réponse identique que l'e-mail existe ou non (pas d'énumération de comptes). */
    @PostMapping("/mot-de-passe/oubli")
    public ResponseEntity<Map<String, String>> motDePasseOublie(@Valid @RequestBody MotDePasseOubliRequest body) {
        serviceAuthentification.demanderReinitialisation(body.email());
        return ResponseEntity.ok(Map.of("message",
                "Si un compte correspond à cette adresse, un e-mail de réinitialisation a été envoyé."));
    }

    @PostMapping("/mot-de-passe/reinitialisation")
    public ResponseEntity<Map<String, String>> reinitialiser(@Valid @RequestBody ReinitialisationMotDePasseRequest body) {
        serviceAuthentification.reinitialiser(body.jeton(), body.nouveauMotDePasse());
        return ResponseEntity.ok(Map.of("message", "Mot de passe réinitialisé. Vous pouvez vous connecter."));
    }

    private void poserCookieRefresh(HttpServletResponse response, String refreshToken) {
        response.addHeader(HttpHeaders.SET_COOKIE,
                cookie(refreshToken, Duration.ofSeconds(jwtWrapper.dureeRefreshSecondes())).toString());
    }

    private ResponseCookie cookie(String valeur, Duration duree) {
        return ResponseCookie.from(COOKIE_REFRESH, valeur)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Strict")
                .path(CHEMIN_COOKIE)
                .maxAge(duree)
                .build();
    }
}
