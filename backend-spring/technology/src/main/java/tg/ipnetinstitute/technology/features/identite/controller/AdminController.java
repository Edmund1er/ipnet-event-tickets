package tg.ipnetinstitute.technology.features.identite.controller;

import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tg.ipnetinstitute.technology.common.response.PageResponse;
import tg.ipnetinstitute.technology.features.identite.dto.request.CreationAgentScanRequest;
import tg.ipnetinstitute.technology.features.identite.dto.response.AgentScanResponse;
import tg.ipnetinstitute.technology.features.identite.dto.response.JournalAuditResponse;
import tg.ipnetinstitute.technology.features.identite.dto.response.ParticipantResponse;
import tg.ipnetinstitute.technology.features.identite.service.ServiceAdmin;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final ServiceAdmin serviceAdmin;
    private final tg.ipnetinstitute.technology.features.identite.service.ServiceTableauDeBord serviceTableauDeBord;

    public AdminController(ServiceAdmin serviceAdmin,
                           tg.ipnetinstitute.technology.features.identite.service.ServiceTableauDeBord serviceTableauDeBord) {
        this.serviceAdmin = serviceAdmin;
        this.serviceTableauDeBord = serviceTableauDeBord;
    }

    @GetMapping("/tableau-de-bord")
    public ResponseEntity<tg.ipnetinstitute.technology.features.identite.dto.response.TableauDeBordResponse> tableauDeBord() {
        return ResponseEntity.ok(serviceTableauDeBord.indicateurs());
    }

    @GetMapping("/evenements/{id}/participants")
    public ResponseEntity<List<ParticipantResponse>> listerParticipants(@PathVariable Long id) {
        return ResponseEntity.ok(serviceAdmin.listerParticipantsEvenement(id));
    }

    @GetMapping("/audit")
    public ResponseEntity<PageResponse<JournalAuditResponse>> consulterAudit(
            @PageableDefault(size = 20, sort = "horodatage", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(PageResponse.de(serviceAdmin.consulterAudit(pageable)));
    }

    @GetMapping("/scanners")
    public ResponseEntity<List<AgentScanResponse>> listerAgentsScan() {
        return ResponseEntity.ok(serviceAdmin.listerAgentsScan());
    }

    @PostMapping("/scanners")
    public ResponseEntity<AgentScanResponse> creerAgentScan(@Valid @RequestBody CreationAgentScanRequest demande) {
        return ResponseEntity.status(HttpStatus.CREATED).body(serviceAdmin.creerAgentScan(demande));
    }

    @PatchMapping("/scanners/{id}/desactivation")
    public ResponseEntity<Map<String, String>> desactiverAgentScan(@PathVariable Long id) {
        serviceAdmin.desactiverAgentScan(id);
        return ResponseEntity.ok(Map.of("message", "Compte agent désactivé avec succès"));
    }
}
