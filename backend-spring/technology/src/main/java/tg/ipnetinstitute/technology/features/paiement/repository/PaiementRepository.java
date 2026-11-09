package tg.ipnetinstitute.technology.features.paiement.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tg.ipnetinstitute.technology.features.paiement.model.Paiement;
import tg.ipnetinstitute.technology.features.paiement.model.StatutPaiement;

import java.util.Optional;

@Repository
public interface PaiementRepository extends JpaRepository<Paiement, Long> {
    Optional<Paiement> findByInscriptionId(Long inscriptionId);
    Optional<Paiement> findByReferenceOperateur(String referenceOperateur);
    boolean existsByEmpreintePreuve(String empreintePreuve);
    boolean existsByReferenceOperateur(String referenceOperateur);
    Page<Paiement> findByStatut(StatutPaiement statut, Pageable pageable);
    long countByStatutAndReferenceOperateurIsNotNull(StatutPaiement statut);
    long countByStatut(StatutPaiement statut);
}
