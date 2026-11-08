package tg.ipnetinstitute.technology.features.billet.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tg.ipnetinstitute.technology.features.billet.model.Billet;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BilletRepository extends JpaRepository<Billet, UUID> {
    Optional<Billet> findByInscriptionId(Long inscriptionId);
}
