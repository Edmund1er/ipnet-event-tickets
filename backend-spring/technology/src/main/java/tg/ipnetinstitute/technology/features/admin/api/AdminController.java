package tg.ipnetinstitute.technology.features.admin.api;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tg.ipnetinstitute.technology.common.audit.JournalAudit;
import tg.ipnetinstitute.technology.features.admin.application.ServiceAdmin;
import tg.ipnetinstitute.technology.features.identite.domaine.Utilisateur;
import tg.ipnetinstitute.technology.features.reservation.domaine.Inscription;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final ServiceAdmin serviceAdmin;

    public AdminController(ServiceAdmin serviceAdmin) {
        this.serviceAdmin = serviceAdmin;
    }

    @GetMapping("/evenements/{id}/participants")
    public ResponseEntity<List<Inscription>> listerParticipants(@PathVariable Long id) {
        return ResponseEntity.ok(serviceAdmin.listerParticipantsEvenement(id));
    }

    @GetMapping("/audit")
    public ResponseEntity<Page<JournalAudit>> consulterAudit(Pageable pageable) {
        return ResponseEntity.ok(serviceAdmin.consulterAudit(pageable));
    }

    @PostMapping("/scanners")
    public ResponseEntity<Map<String, Object>> creerAgentScan(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String telephone = body.get("telephone");
        String motDePasse = body.get("motDePasse");

        Utilisateur agent = serviceAdmin.creerAgentScan(email, telephone, motDePasse);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", agent.getId(),
                "email", agent.getEmail(),
                "role", agent.getRole(),
                "message", "Agent de scan créé avec succès"
        ));
    }

    @PatchMapping("/scanners/{id}/desactivation")
    public ResponseEntity<Map<String, String>> desactiverAgentScan(@PathVariable Long id) {
        serviceAdmin.desactiverAgentScan(id);
        return ResponseEntity.ok(Map.of("message", "Compte agent désactivé avec succès"));
    }
}
