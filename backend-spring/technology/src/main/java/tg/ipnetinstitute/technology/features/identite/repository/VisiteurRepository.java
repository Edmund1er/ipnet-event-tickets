package tg.ipnetinstitute.technology.features.identite.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tg.ipnetinstitute.technology.features.identite.model.Visiteur;

@Repository
public interface VisiteurRepository extends JpaRepository<Visiteur, Long> {
}
