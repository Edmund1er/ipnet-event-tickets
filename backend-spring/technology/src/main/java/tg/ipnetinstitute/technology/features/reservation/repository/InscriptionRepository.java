package tg.ipnetinstitute.technology.features.reservation.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tg.ipnetinstitute.technology.features.reservation.model.Inscription;
import tg.ipnetinstitute.technology.features.reservation.model.StatutInscription;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InscriptionRepository extends JpaRepository<Inscription, Long> {
    boolean existsByUtilisateurIdAndEvenementId(Long utilisateurId, Long evenementId);
    Page<Inscription> findByUtilisateurId(Long utilisateurId, Pageable pageable);
    List<Inscription> findByEvenementIdAndStatutIn(Long evenementId, List<StatutInscription> statuts);
    List<Inscription> findByStatutAndExpireLeBefore(StatutInscription statut, LocalDateTime now);
    List<Inscription> findByEvenementIdOrderByCreeLeAsc(Long evenementId);
    long countByEvenementIdAndStatut(Long evenementId, StatutInscription statut);
    long countByStatut(StatutInscription statut);
    boolean existsByEvenementId(Long evenementId);
}
