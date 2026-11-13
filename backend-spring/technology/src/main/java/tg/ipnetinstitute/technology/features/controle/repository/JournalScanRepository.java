package tg.ipnetinstitute.technology.features.controle.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tg.ipnetinstitute.technology.features.controle.model.JournalScan;
import tg.ipnetinstitute.technology.features.controle.model.ResultatScanEnum;

import java.util.List;

@Repository
public interface JournalScanRepository extends JpaRepository<JournalScan, Long> {
    long countByEvenementIdAndResultat(Long evenementId, ResultatScanEnum resultat);
    java.util.Optional<JournalScan> findFirstByBilletIdAndEvenementIdAndResultatOrderByHorodatageAsc(java.util.UUID billetId, Long evenementId, ResultatScanEnum resultat);
    List<JournalScan> findByEvenementIdAndResultatOrderByHorodatageAsc(Long evenementId, ResultatScanEnum resultat);
}
