package tg.ipnetinstitute.technology.features.identite.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tg.ipnetinstitute.technology.features.identite.domaine.VerificationOtp;

import java.util.Optional;

@Repository
public interface VerificationOtpRepository extends JpaRepository<VerificationOtp, Long> {
    Optional<VerificationOtp> findTopByUtilisateurIdAndConsommeFalseOrderByExpireLeDesc(Long utilisateurId);
}
