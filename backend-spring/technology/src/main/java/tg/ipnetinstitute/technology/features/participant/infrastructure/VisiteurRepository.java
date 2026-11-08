package tg.ipnetinstitute.technology.features.participant.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tg.ipnetinstitute.technology.features.participant.domaine.Visiteur;

@Repository
public interface VisiteurRepository extends JpaRepository<Visiteur, Long> {
}
