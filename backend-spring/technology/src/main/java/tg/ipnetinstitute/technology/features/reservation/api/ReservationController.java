package tg.ipnetinstitute.technology.features.reservation.api;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tg.ipnetinstitute.technology.features.reservation.application.ServiceReservation;
import tg.ipnetinstitute.technology.features.reservation.domaine.Inscription;

import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ServiceReservation serviceReservation;

    public ReservationController(ServiceReservation serviceReservation) {
        this.serviceReservation = serviceReservation;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> reserver(
            @RequestBody Map<String, Long> body,
            @AuthenticationPrincipal Long utilisateurId) {
        Long evenementId = body.get("evenementId");
        Inscription inscription = serviceReservation.reserver(utilisateurId, evenementId);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", inscription.getId(),
                "statut", inscription.getStatut(),
                "expireLe", inscription.getExpireLe()
        ));
    }

    @GetMapping("/moi")
    public ResponseEntity<Page<Inscription>> mesReservations(
            @AuthenticationPrincipal Long utilisateurId,
            Pageable pageable) {
        return ResponseEntity.ok(serviceReservation.mesReservations(utilisateurId, pageable));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> annuler(
            @PathVariable Long id,
            @AuthenticationPrincipal Long utilisateurId) {
        serviceReservation.annuler(id, utilisateurId);
        return ResponseEntity.ok(Map.of("message", "Réservation annulée avec succès"));
    }
}
