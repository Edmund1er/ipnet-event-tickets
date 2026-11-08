package tg.ipnetinstitute.technology.features.controle.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tg.ipnetinstitute.technology.features.controle.domaine.JournalScan;
import tg.ipnetinstitute.technology.features.controle.domaine.ResultatScanEnum;

import java.util.List;

@Repository
public interface JournalScanRepository extends JpaRepository<JournalScan, Long> {
    long countByEvenementIdAndResultat(Long evenementId, ResultatScanEnum resultat);
    List<JournalScan> findByEvenementIdAndResultatOrderByHorodatageAsc(Long evenementId, ResultatScanEnum resultat);
}
