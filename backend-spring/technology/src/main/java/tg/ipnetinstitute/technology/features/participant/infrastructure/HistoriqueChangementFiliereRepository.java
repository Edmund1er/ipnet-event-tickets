package tg.ipnetinstitute.technology.features.participant.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tg.ipnetinstitute.technology.features.participant.domaine.HistoriqueChangementFiliere;

import java.util.List;

@Repository
public interface HistoriqueChangementFiliereRepository extends JpaRepository<HistoriqueChangementFiliere, Long> {
    List<HistoriqueChangementFiliere> findByEtudiantIdOrderByModifieLeDesc(Long etudiantId);
}
