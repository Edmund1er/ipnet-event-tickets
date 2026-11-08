package tg.ipnetinstitute.technology.features.evenement.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tg.ipnetinstitute.technology.features.evenement.model.Evenement;
import tg.ipnetinstitute.technology.features.evenement.model.StatutEvenement;

import java.util.Optional;

@Repository
public interface EvenementRepository extends JpaRepository<Evenement, Long> {

    /**
     * Verrou pessimiste (PESSIMISTIC_WRITE) pour sérialiser les réservations
     * et garantir l'absence de surréservation sous charge (Section 9.5).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Evenement e WHERE e.id = :id")
    Optional<Evenement> findByIdForUpdate(@Param("id") Long id);

    Page<Evenement> findByStatut(StatutEvenement statut, Pageable pageable);
}
