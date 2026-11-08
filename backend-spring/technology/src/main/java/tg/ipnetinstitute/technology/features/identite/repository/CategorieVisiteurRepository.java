package tg.ipnetinstitute.technology.features.identite.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tg.ipnetinstitute.technology.features.identite.model.CategorieVisiteur;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategorieVisiteurRepository extends JpaRepository<CategorieVisiteur, Long> {
    Optional<CategorieVisiteur> findByIdAndActifTrue(Long id);
    Optional<CategorieVisiteur> findByCodeAndActifTrue(String code);
    List<CategorieVisiteur> findByActifTrue();
}
