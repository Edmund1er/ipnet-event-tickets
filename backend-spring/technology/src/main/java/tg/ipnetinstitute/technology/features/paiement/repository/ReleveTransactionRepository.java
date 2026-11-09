package tg.ipnetinstitute.technology.features.paiement.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tg.ipnetinstitute.technology.features.paiement.model.ReleveTransaction;

import java.util.Optional;

@Repository
public interface ReleveTransactionRepository extends JpaRepository<ReleveTransaction, Long> {
    Optional<ReleveTransaction> findByReferenceOperateurAndRapprocheFalse(String referenceOperateur);
    boolean existsByReferenceOperateur(String referenceOperateur);
}
