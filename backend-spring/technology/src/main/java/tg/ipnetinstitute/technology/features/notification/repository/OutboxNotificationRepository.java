package tg.ipnetinstitute.technology.features.notification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tg.ipnetinstitute.technology.features.notification.model.OutboxNotification;
import tg.ipnetinstitute.technology.features.notification.model.StatutOutbox;

import java.util.List;

@Repository
public interface OutboxNotificationRepository extends JpaRepository<OutboxNotification, Long> {
    List<OutboxNotification> findTop20ByStatutOrderByCreeLeAsc(StatutOutbox statut);
    long countByStatut(StatutOutbox statut);
    org.springframework.data.domain.Page<OutboxNotification> findByStatut(StatutOutbox statut, org.springframework.data.domain.Pageable pageable);
}
