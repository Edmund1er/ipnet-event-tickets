package tg.ipnetinstitute.technology.features.evenement.api;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tg.ipnetinstitute.technology.features.evenement.application.DemandeEvenement;
import tg.ipnetinstitute.technology.features.evenement.application.EvenementResume;
import tg.ipnetinstitute.technology.features.evenement.application.ServiceEvenement;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class EvenementController {

    private final ServiceEvenement serviceEvenement;

    public EvenementController(ServiceEvenement serviceEvenement) {
        this.serviceEvenement = serviceEvenement;
    }

    @GetMapping("/evenements")
    public ResponseEntity<Page<EvenementResume>> listerPublies(Pageable pageable) {
        return ResponseEntity.ok(serviceEvenement.listerPublies(pageable));
    }

    @GetMapping("/evenements/{id}")
    public ResponseEntity<EvenementResume> consulter(@PathVariable Long id) {
        return ResponseEntity.ok(serviceEvenement.consulter(id));
    }

    @PostMapping("/admin/evenements")
    public ResponseEntity<Map<String, Object>> creer(
            @Valid @RequestBody DemandeEvenement demande,
            @AuthenticationPrincipal Long adminId) {
        var e = serviceEvenement.creer(demande, adminId);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", e.getId(), "message", "Événement créé avec succès"));
    }

    @PutMapping("/admin/evenements/{id}")
    public ResponseEntity<Map<String, Object>> modifier(
            @PathVariable Long id,
            @Valid @RequestBody tg.ipnetinstitute.technology.features.evenement.application.ModificationEvenement demande,
            @AuthenticationPrincipal Long adminId) {
        var e = serviceEvenement.modifier(id, demande, adminId);
        return ResponseEntity.ok(Map.of("id", e.getId(), "message", "Événement modifié avec succès"));
    }

    @PostMapping("/admin/evenements/{id}/publication")
    public ResponseEntity<Map<String, String>> publier(
            @PathVariable Long id,
            @AuthenticationPrincipal Long adminId) {
        serviceEvenement.publier(id, adminId);
        return ResponseEntity.ok(Map.of("message", "Événement publié"));
    }

    @PostMapping("/admin/evenements/{id}/annulation")
    public ResponseEntity<Map<String, String>> annuler(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal Long adminId) {
        String motif = body != null ? body.getOrDefault("motif", "Annulation administrative") : "Annulation administrative";
        serviceEvenement.annuler(id, adminId, motif);
        return ResponseEntity.ok(Map.of("message", "Événement annulé"));
    }
}
