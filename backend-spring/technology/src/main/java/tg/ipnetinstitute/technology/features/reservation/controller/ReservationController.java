package tg.ipnetinstitute.technology.features.reservation.controller;

import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tg.ipnetinstitute.technology.common.response.PageResponse;
import tg.ipnetinstitute.technology.features.reservation.dto.request.ReservationRequest;
import tg.ipnetinstitute.technology.features.reservation.dto.response.ReservationResponse;
import tg.ipnetinstitute.technology.features.reservation.service.ServiceReservation;

import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ServiceReservation serviceReservation;

    public ReservationController(ServiceReservation serviceReservation) {
        this.serviceReservation = serviceReservation;
    }

    @PostMapping
    public ResponseEntity<ReservationResponse> reserver(@Valid @RequestBody ReservationRequest body,
                                                        @AuthenticationPrincipal Long utilisateurId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(serviceReservation.reserver(utilisateurId, body.evenementId()));
    }

    @GetMapping("/moi")
    public ResponseEntity<PageResponse<ReservationResponse>> mesReservations(
            @AuthenticationPrincipal Long utilisateurId,
            @PageableDefault(size = 20, sort = "creeLe", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(PageResponse.de(serviceReservation.mesReservations(utilisateurId, pageable)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> annuler(@PathVariable Long id,
                                                       @AuthenticationPrincipal Long utilisateurId) {
        serviceReservation.annuler(id, utilisateurId);
        return ResponseEntity.ok(Map.of("message", "Réservation annulée avec succès"));
    }
}
