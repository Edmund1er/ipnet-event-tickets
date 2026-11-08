package tg.ipnetinstitute.technology.common.domaine;

import org.junit.jupiter.api.Test;
import tg.ipnetinstitute.technology.common.exception.EmailInvalideException;
import tg.ipnetinstitute.technology.common.exception.TelephoneInvalideException;

import static org.junit.jupiter.api.Assertions.*;

class ValueObjectsTest {

    @Test
    void emailValideEtNormalise() {
        Email email = new Email("  Etudiant.Test@IPNET.TG  ");
        assertEquals("etudiant.test@ipnet.tg", email.valeur());
    }

    @Test
    void emailInvalideDeclencheException() {
        assertThrows(EmailInvalideException.class, () -> new Email("invalide-sans-arobase"));
        assertThrows(EmailInvalideException.class, () -> new Email(null));
    }

    @Test
    void telephoneValideE164Normalise() {
        Telephone tel = new Telephone("+228 90 12 34 56");
        assertEquals("+22890123456", tel.valeur());
    }

    @Test
    void telephoneInvalideDeclencheException() {
        assertThrows(TelephoneInvalideException.class, () -> new Telephone("06123456")); // manque indicatif pays
        assertThrows(TelephoneInvalideException.class, () -> new Telephone(""));
    }
}
