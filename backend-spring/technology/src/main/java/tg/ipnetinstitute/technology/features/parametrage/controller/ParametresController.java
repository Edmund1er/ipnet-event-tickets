package tg.ipnetinstitute.technology.features.parametrage.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tg.ipnetinstitute.technology.features.identite.service.ServiceIdentite;
import tg.ipnetinstitute.technology.features.notification.service.ServiceDiagnosticSmtp;
import tg.ipnetinstitute.technology.features.parametrage.dto.ParametresDto.*;
import tg.ipnetinstitute.technology.features.parametrage.service.ServiceParametres;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class ParametresController {

    private final ServiceParametres serviceParametres;
    private final ServiceDiagnosticSmtp diagnosticSmtp;
    private final ServiceIdentite serviceIdentite;

    public ParametresController(ServiceParametres serviceParametres, ServiceDiagnosticSmtp diagnosticSmtp,
                                ServiceIdentite serviceIdentite) {
        this.serviceParametres = serviceParametres;
        this.diagnosticSmtp = diagnosticSmtp;
        this.serviceIdentite = serviceIdentite;
    }

    /** EF-07 : numéro de paiement visible par tout utilisateur connecté (configure=false s'il n'est pas encore saisi). */
    @GetMapping("/parametres/paiement")
    public ResponseEntity<ParametresPaiement> paiement() {
        return ResponseEntity.ok(serviceParametres.paiement());
    }

    @GetMapping("/admin/parametres")
    public ResponseEntity<ParametresAdmin> parametresAdmin() {
        var smtp = diagnosticSmtp.etat();
        return ResponseEntity.ok(new ParametresAdmin(serviceParametres.paiement(),
                new EtatSmtp(smtp.configure(), smtp.hote(), smtp.port(), smtp.expediteur())));
    }

    @PutMapping("/admin/parametres/paiement")
    public ResponseEntity<ParametresPaiement> modifierPaiement(@Valid @RequestBody ModificationPaiement demande,
                                                               @AuthenticationPrincipal Long adminId) {
        return ResponseEntity.ok(serviceParametres.modifierPaiement(demande, adminId));
    }

    @GetMapping("/admin/parametres/analyse-numero")
    public ResponseEntity<AnalyseNumero> analyser(@RequestParam String numero) {
        return ResponseEntity.ok(serviceParametres.analyser(numero));
    }

    @PostMapping("/admin/parametres/test-email")
    public ResponseEntity<Map<String, String>> testEmail(@AuthenticationPrincipal Long adminId) {
        String destinataire = serviceIdentite.emailDe(adminId).orElseThrow();
        diagnosticSmtp.envoyerTest(destinataire);
        return ResponseEntity.ok(Map.of("message", "E-mail de test envoyé à " + destinataire));
    }
}
