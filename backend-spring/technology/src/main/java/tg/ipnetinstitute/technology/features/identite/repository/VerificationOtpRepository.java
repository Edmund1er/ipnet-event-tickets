package tg.ipnetinstitute.technology.features.identite.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tg.ipnetinstitute.technology.features.identite.model.ObjetOtp;
import tg.ipnetinstitute.technology.features.identite.model.VerificationOtp;

import java.util.Optional;

@Repository
public interface VerificationOtpRepository extends JpaRepository<VerificationOtp, Long> {
    Optional<VerificationOtp> findTopByUtilisateurIdAndObjetAndConsommeFalseOrderByExpireLeDesc(Long utilisateurId, ObjetOtp objet);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("update VerificationOtp o set o.consomme = true where o.utilisateurId = :id and o.objet = :objet and o.consomme = false")
    void invaliderCodesEnCours(@org.springframework.data.repository.query.Param("id") Long utilisateurId,
                               @org.springframework.data.repository.query.Param("objet") ObjetOtp objet);
}
