package tg.ipnetinstitute.technology.features.identite.controller;
import tg.ipnetinstitute.technology.features.identite.dto.request.DemandeInscription;
import tg.ipnetinstitute.technology.features.identite.dto.response.ReponseInscription;
import tg.ipnetinstitute.technology.features.identite.service.ServiceAuthentification;
import tg.ipnetinstitute.technology.features.identite.service.ServiceInscription;
import tg.ipnetinstitute.technology.features.identite.service.ServiceVerificationTelephone;
import tg.ipnetinstitute.technology.features.identite.dto.response.TokensAcces;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tg.ipnetinstitute.technology.common.utils.Email;
import tg.ipnetinstitute.technology.features.identite.dto.request.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final ServiceInscription serviceInscription;
    private final ServiceVerificationTelephone serviceVerificationTelephone;
    private final ServiceAuthentification serviceAuthentification;

    public AuthController(ServiceInscription serviceInscription,
                          ServiceVerificationTelephone serviceVerificationTelephone,
                          ServiceAuthentification serviceAuthentification) {
        this.serviceInscription = serviceInscription;
        this.serviceVerificationTelephone = serviceVerificationTelephone;
        this.serviceAuthentification = serviceAuthentification;
    }

    @PostMapping("/inscription")
    public ResponseEntity<ReponseInscription> inscrire(@Valid @RequestBody DemandeInscription demande) {
        ReponseInscription reponse = serviceInscription.inscrire(demande);
        return ResponseEntity.status(HttpStatus.CREATED).body(reponse);
    }

    @PostMapping("/otp/envoi")
    public ResponseEntity<Map<String, String>> renvoyerOtp(@AuthenticationPrincipal Long utilisateurId) {
        serviceVerificationTelephone.envoyerCode(utilisateurId);
        return ResponseEntity.ok(Map.of("message", "Nouveau code OTP envoyé"));
    }

    @PostMapping("/otp/verification")
    public ResponseEntity<Map<String, String>> verifierOtp(
            @AuthenticationPrincipal Long utilisateurId,
            @RequestBody Map<String, String> body) {
        String code = body.get("code");
        serviceVerificationTelephone.verifier(utilisateurId, code);
        return ResponseEntity.ok(Map.of("message", "Téléphone vérifié avec succès"));
    }

    @PostMapping("/connexion")
    public ResponseEntity<Map<String, Object>> connecter(
            @RequestBody Map<String, String> body,
            HttpServletResponse response) {
        String email = body.get("email");
        String motDePasse = body.get("motDePasse");

        TokensAcces tokens = serviceAuthentification.connecter(new Email(email), motDePasse);

        // Refresh token en cookie HttpOnly, Secure, SameSite=Strict (Section 5.1)
        Cookie refreshCookie = new Cookie("refreshToken", tokens.refreshToken());
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(true);
        refreshCookie.setPath("/api/auth/rafraichir");
        refreshCookie.setMaxAge(7 * 24 * 3600); // 7 jours
        refreshCookie.setAttribute("SameSite", "Strict");
        response.addCookie(refreshCookie);

        return ResponseEntity.ok(Map.of(
                "accessToken", tokens.accessToken(),
                "expireDans", tokens.expireDans()
        ));
    }

    @PostMapping("/rafraichir")
    public ResponseEntity<Map<String, Object>> rafraichir(
            @CookieValue(name = "refreshToken") String refreshToken,
            HttpServletResponse response) {
        TokensAcces tokens = serviceAuthentification.rafraichir(refreshToken);

        Cookie refreshCookie = new Cookie("refreshToken", tokens.refreshToken());
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(true);
        refreshCookie.setPath("/api/auth/rafraichir");
        refreshCookie.setMaxAge(7 * 24 * 3600);
        refreshCookie.setAttribute("SameSite", "Strict");
        response.addCookie(refreshCookie);

        return ResponseEntity.ok(Map.of(
                "accessToken", tokens.accessToken(),
                "expireDans", tokens.expireDans()
        ));
    }
}
