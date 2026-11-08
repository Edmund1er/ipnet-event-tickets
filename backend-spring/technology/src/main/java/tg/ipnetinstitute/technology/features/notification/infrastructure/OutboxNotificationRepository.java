package tg.ipnetinstitute.technology.features.notification.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tg.ipnetinstitute.technology.features.notification.domaine.OutboxNotification;
import tg.ipnetinstitute.technology.features.notification.domaine.StatutOutbox;

import java.util.List;

@Repository
public interface OutboxNotificationRepository extends JpaRepository<OutboxNotification, Long> {
    List<OutboxNotification> findTop20ByStatutOrderByCreeLeAsc(StatutOutbox statut);
}
