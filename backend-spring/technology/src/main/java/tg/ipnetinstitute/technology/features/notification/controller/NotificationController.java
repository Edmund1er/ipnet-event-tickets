package tg.ipnetinstitute.technology.features.notification.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import tg.ipnetinstitute.technology.common.exception.RessourceIntrouvableException;
import tg.ipnetinstitute.technology.common.response.PageResponse;
import tg.ipnetinstitute.technology.features.notification.dto.response.NotificationResponse;
import tg.ipnetinstitute.technology.features.notification.model.OutboxNotification;
import tg.ipnetinstitute.technology.features.notification.model.StatutOutbox;
import tg.ipnetinstitute.technology.features.notification.repository.OutboxNotificationRepository;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/notifications")
@Tag(name = "Notifications", description = "Suivi et relance de l'outbox transactionnelle")
public class NotificationController {

    private final OutboxNotificationRepository outboxRepository;

    public NotificationController(OutboxNotificationRepository outboxRepository) {
        this.outboxRepository = outboxRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(summary = "Lister les notifications (filtre facultatif par statut)")
    public PageResponse<NotificationResponse> lister(
            @RequestParam(required = false) StatutOutbox statut,
            @PageableDefault(size = 20, sort = "creeLe", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<OutboxNotification> page = statut == null
                ? outboxRepository.findAll(pageable)
                : outboxRepository.findByStatut(statut, pageable);
        return PageResponse.de(page.map(NotificationController::versResponse));
    }

    @PostMapping("/{id}/relance")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Transactional
    @Operation(summary = "Relancer une notification en échec")
    public ResponseEntity<Map<String, String>> relancer(@PathVariable Long id) {
        OutboxNotification n = outboxRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Notification", id));
        if (n.getStatut() != StatutOutbox.ECHEC) {
            throw new IllegalStateException("Seule une notification en échec peut être relancée");
        }
        n.relancer();
        outboxRepository.save(n);
        return ResponseEntity.ok(Map.of("message", "Notification remise en file d'envoi"));
    }

    private static NotificationResponse versResponse(OutboxNotification n) {
        return new NotificationResponse(n.getId(), n.getCanal(), n.getDestinataire(), n.getModele(),
                n.getStatut(), n.getTentatives(), n.getDerniereErreur(), n.getCreeLe());
    }
}
