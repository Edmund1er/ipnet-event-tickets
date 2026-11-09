package tg.ipnetinstitute.technology.features.identite.controller;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tg.ipnetinstitute.technology.features.identite.dto.response.SessionResponse;
import tg.ipnetinstitute.technology.features.identite.dto.response.TokensAcces;
import tg.ipnetinstitute.technology.features.identite.service.ServiceAuthentification;
import tg.ipnetinstitute.technology.features.identite.service.ServiceInstallation;

import java.util.Map;

/** Première installation de la plateforme (création du compte administrateur). */
@RestController
@RequestMapping("/api/installation")
public class InstallationController {

    public record DemandeInstallation(
            @NotBlank(message = "Le code d'installation est obligatoire") String code,
            @NotBlank String email,
            @NotBlank String telephone,
            @NotBlank String motDePasse
    ) {}

    private final ServiceInstallation serviceInstallation;
    private final ServiceAuthentification serviceAuthentification;
    private final CookieRafraichissement cookie;

    public InstallationController(ServiceInstallation serviceInstallation, ServiceAuthentification serviceAuthentification,
                                  CookieRafraichissement cookie) {
        this.serviceInstallation = serviceInstallation;
        this.serviceAuthentification = serviceAuthentification;
        this.cookie = cookie;
    }

    @GetMapping
    public ResponseEntity<Map<String, Boolean>> etat() {
        return ResponseEntity.ok(Map.of("installationRequise", serviceInstallation.installationRequise()));
    }

    @PostMapping
    public ResponseEntity<SessionResponse> installer(@Valid @RequestBody DemandeInstallation d, HttpServletResponse response) {
        Long id = serviceInstallation.installer(d.code(), d.email(), d.telephone(), d.motDePasse());
        TokensAcces tokens = serviceAuthentification.ouvrirSession(id);
        cookie.poser(response, tokens.refreshToken());
        return ResponseEntity.status(HttpStatus.CREATED).body(tokens.versSession());
    }
}
