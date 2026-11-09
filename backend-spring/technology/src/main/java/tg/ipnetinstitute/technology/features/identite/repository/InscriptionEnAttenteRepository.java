package tg.ipnetinstitute.technology.features.identite.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tg.ipnetinstitute.technology.features.identite.model.InscriptionEnAttente;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface InscriptionEnAttenteRepository extends JpaRepository<InscriptionEnAttente, Long> {
    Optional<InscriptionEnAttente> findByEmail(String email);

    @Modifying
    @Query("delete from InscriptionEnAttente i where i.creeLe < :limite")
    int supprimerAnterieuresA(@Param("limite") LocalDateTime limite);
}
