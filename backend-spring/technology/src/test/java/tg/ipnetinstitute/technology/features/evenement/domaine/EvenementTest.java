package tg.ipnetinstitute.technology.features.evenement.domaine;

import org.junit.jupiter.api.Test;
import tg.ipnetinstitute.technology.common.exception.CapaciteAtteinteException;
import tg.ipnetinstitute.technology.features.evenement.model.Evenement;
import tg.ipnetinstitute.technology.features.evenement.model.StatutEvenement;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class EvenementTest {

    @Test
    void reservationRespecteCapaciteEtInvariants() {
        Evenement e = Evenement.creer("Gala Tech", "Soirée annuelle", LocalDateTime.now().plusDays(10), "Campus",
                BigDecimal.valueOf(5000), "XOF", 2, 1L);

        // Publication
        e.publier(java.time.Clock.systemDefaultZone());
        assertEquals(StatutEvenement.PUBLIE, e.getStatut());

        // 1ère réservation
        e.reserverPlace();
        assertEquals(1, e.getPlacesReservees());

        // 2ème réservation (pleine capacité)
        e.reserverPlace();
        assertEquals(2, e.getPlacesReservees());

        // 3ème réservation : doit échouer (RG-08)
        assertThrows(CapaciteAtteinteException.class, e::reserverPlace);
    }
}
