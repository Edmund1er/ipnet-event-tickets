package tg.ipnetinstitute.technology.features.paiement.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tg.ipnetinstitute.technology.features.paiement.domaine.ReleveTransaction;

import java.util.Optional;

@Repository
public interface ReleveTransactionRepository extends JpaRepository<ReleveTransaction, Long> {
    Optional<ReleveTransaction> findByReferenceOperateurAndRapprocheFalse(String referenceOperateur);
}
