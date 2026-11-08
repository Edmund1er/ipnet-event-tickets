package tg.ipnetinstitute.technology.config;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JournalAuditRepository extends JpaRepository<JournalAudit, Long> {
    List<JournalAudit> findByTypeCibleAndIdCible(String typeCible, String idCible);
}
