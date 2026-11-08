package tg.ipnetinstitute.technology.features.participant.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tg.ipnetinstitute.technology.features.participant.domaine.Filiere;

import java.util.List;
import java.util.Optional;

@Repository
public interface FiliereRepository extends JpaRepository<Filiere, Long> {
    Optional<Filiere> findByIdAndActifTrue(Long id);
    List<Filiere> findByActifTrue();
}
