package tg.ipnetinstitute.technology.features.notification.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tg.ipnetinstitute.technology.common.response.ApiResponse;
import tg.ipnetinstitute.technology.common.response.PageResponse;
import tg.ipnetinstitute.technology.features.notification.dto.response.NotificationResponse;
import tg.ipnetinstitute.technology.features.notification.model.OutboxNotification;
import tg.ipnetinstitute.technology.features.notification.repository.OutboxNotificationRepository;

@RestController
@RequestMapping("/api/admin/notifications")
@Tag(name = "Notifications", description = "Consultation du journal et de l'état de l'Outbox transactionnelle")
public class NotificationController {

    private final OutboxNotificationRepository outboxRepository;

    public NotificationController(OutboxNotificationRepository outboxRepository) {
        this.outboxRepository = outboxRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @Operation(summary = "Lister les notifications outbox", description = "Permet à l'administrateur de surveiller l'état des envois e-mail/SMS")
    public ApiResponse<PageResponse<NotificationResponse>> lister(Pageable pageable) {
        Page<NotificationResponse> page = outboxRepository.findAll(pageable)
                .map(this::toResponse);
        return ApiResponse.succes(PageResponse.de(page));
    }

    private NotificationResponse toResponse(OutboxNotification n) {
        return new NotificationResponse(
                n.getId(),
                n.getCanal(),
                n.getDestinataire(),
                n.getModele(),
                n.getStatut(),
                n.getTentatives(),
                n.getCreeLe()
        );
    }
}
