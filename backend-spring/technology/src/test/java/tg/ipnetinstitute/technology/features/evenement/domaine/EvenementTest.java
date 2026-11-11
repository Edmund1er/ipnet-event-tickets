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

    private Evenement publie(int capacite) {
        Evenement e = Evenement.creer("Gala", null, LocalDateTime.now().plusDays(10), "Campus",
                BigDecimal.valueOf(500), "XOF", capacite, 1L);
        e.publier(java.time.Clock.systemDefaultZone());
        return e;
    }

    @Test
    void ajouterDesPlacesRouvreUnEvenementComplet() {
        Evenement e = publie(1);
        e.reserverPlace();
        assertFalse(e.ventesOuvertes(LocalDateTime.now()), "complet : ventes fermées");
        e.ajusterCapacite(3);
        assertTrue(e.ventesOuvertes(LocalDateTime.now()), "places ajoutées : ventes rouvertes");
    }

    @Test
    void capaciteSousLesPlacesReserveesRefusee() {
        Evenement e = publie(5);
        e.reserverPlace();
        e.reserverPlace();
        assertThrows(IllegalArgumentException.class, () -> e.ajusterCapacite(1));
        e.ajusterCapacite(2);
        assertEquals(2, e.getCapacite());
    }

    @Test
    void fermetureManuelleEtReouverture() {
        Evenement e = publie(5);
        e.suspendreVentes();
        assertFalse(e.ventesOuvertes(LocalDateTime.now()));
        e.reprendreVentes();
        assertTrue(e.ventesOuvertes(LocalDateTime.now()));
    }

    @Test
    void dateLimiteDepasseeFermePuisRepousseeRouvre() {
        Evenement e = publie(5);
        e.definirDateLimite(LocalDateTime.now().plusDays(1));
        assertFalse(e.ventesOuvertes(LocalDateTime.now().plusDays(2)));
        e.definirDateLimite(LocalDateTime.now().plusDays(5));
        assertTrue(e.ventesOuvertes(LocalDateTime.now().plusDays(2)));
        assertThrows(IllegalArgumentException.class, () -> e.definirDateLimite(LocalDateTime.now().plusDays(11)));
    }

    @Test
    void libererUnePlaceRouvreLaVente() {
        Evenement e = publie(1);
        e.reserverPlace();
        assertFalse(e.ventesOuvertes(LocalDateTime.now()));
        e.libererPlace();
        assertTrue(e.ventesOuvertes(LocalDateTime.now()));
    }

    @Test
    void evenementTermineOuAnnuleNeSeRouvrePas() {
        Evenement termine = publie(5);
        termine.terminer();
        assertThrows(IllegalStateException.class, termine::reprendreVentes);
        assertThrows(IllegalStateException.class, () -> termine.ajusterCapacite(10));
        assertFalse(termine.ventesOuvertes(LocalDateTime.now()));

        Evenement annule = publie(5);
        annule.annuler();
        assertThrows(IllegalStateException.class, () -> annule.definirDateLimite(null));
    }
}
