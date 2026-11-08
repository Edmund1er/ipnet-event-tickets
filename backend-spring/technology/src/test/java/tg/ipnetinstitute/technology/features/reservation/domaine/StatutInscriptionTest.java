package tg.ipnetinstitute.technology.features.reservation.domaine;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class StatutInscriptionTest {

    @Test
    void transitionsAutoriseesEtInterdites() {
        // EN_ATTENTE_PAIEMENT -> PREUVE_ENVOYEE, ANNULEE, EXPIREE
        assertTrue(StatutInscription.EN_ATTENTE_PAIEMENT.peutPasserA(StatutInscription.PREUVE_ENVOYEE));
        assertTrue(StatutInscription.EN_ATTENTE_PAIEMENT.peutPasserA(StatutInscription.ANNULEE));
        assertTrue(StatutInscription.EN_ATTENTE_PAIEMENT.peutPasserA(StatutInscription.EXPIREE));
        assertFalse(StatutInscription.EN_ATTENTE_PAIEMENT.peutPasserA(StatutInscription.CONFIRMEE));

        // PREUVE_ENVOYEE -> CONFIRMEE, REJETEE, ANNULEE
        assertTrue(StatutInscription.PREUVE_ENVOYEE.peutPasserA(StatutInscription.CONFIRMEE));
        assertTrue(StatutInscription.PREUVE_ENVOYEE.peutPasserA(StatutInscription.REJETEE));
        assertFalse(StatutInscription.PREUVE_ENVOYEE.peutPasserA(StatutInscription.EXPIREE));

        // CONFIRMEE -> ANNULEE possible lors de l'annulation d'un événement (RG-19)
        assertTrue(StatutInscription.CONFIRMEE.peutPasserA(StatutInscription.ANNULEE));
        assertFalse(StatutInscription.CONFIRMEE.peutPasserA(StatutInscription.PREUVE_ENVOYEE));
    }
}
