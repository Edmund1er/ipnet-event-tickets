package tg.ipnetinstitute.technology.features.billet.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tg.ipnetinstitute.technology.features.billet.domaine.Billet;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BilletRepository extends JpaRepository<Billet, UUID> {
    Optional<Billet> findByInscriptionId(Long inscriptionId);
}
