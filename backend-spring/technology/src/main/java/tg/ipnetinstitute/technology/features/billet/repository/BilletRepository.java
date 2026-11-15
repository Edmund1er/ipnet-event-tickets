package tg.ipnetinstitute.technology.features.billet.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;
import tg.ipnetinstitute.technology.features.billet.model.Billet;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BilletRepository extends JpaRepository<Billet, UUID> {
    Optional<Billet> findByInscriptionId(Long inscriptionId);

    /** Sérialise les scans de pass : plusieurs agents ne peuvent accepter simultanément le même billet/jour. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Billet b where b.id = :id")
    Optional<Billet> verrouillerParId(@Param("id") UUID id);

    long countByInvalideFalse();
    long countByScanneLeIsNotNull();
}
