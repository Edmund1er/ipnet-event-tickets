package tg.ipnetinstitute.technology.features.identite.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tg.ipnetinstitute.technology.features.identite.model.HistoriqueChangementFiliere;

import java.util.List;

@Repository
public interface HistoriqueChangementFiliereRepository extends JpaRepository<HistoriqueChangementFiliere, Long> {
    List<HistoriqueChangementFiliere> findByEtudiantIdOrderByModifieLeDesc(Long etudiantId);
}
