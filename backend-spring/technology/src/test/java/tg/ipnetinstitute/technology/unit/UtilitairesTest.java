package tg.ipnetinstitute.technology.unit;

import org.junit.jupiter.api.Test;
import tg.ipnetinstitute.technology.common.utils.Montant;
import tg.ipnetinstitute.technology.features.billet.utils.JetonUtils;
import tg.ipnetinstitute.technology.features.controle.utils.StatistiquesUtils;
import tg.ipnetinstitute.technology.features.identite.utils.EmailNormaliseur;
import tg.ipnetinstitute.technology.features.identite.utils.TelephoneUtils;
import tg.ipnetinstitute.technology.features.notification.utils.GabaritsEmail;
import tg.ipnetinstitute.technology.features.paiement.utils.EmpreinteUtils;
import tg.ipnetinstitute.technology.features.paiement.utils.ReferencePaiementUtils;
import tg.ipnetinstitute.technology.features.reservation.model.StatutInscription;
import tg.ipnetinstitute.technology.features.reservation.utils.DelaiExpirationUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Tests unitaires des utilitaires et valeurs d'objets (RG-01, RG-13, RG-17, EF-24, §8 e-mails). */
class UtilitairesTest {

    @Test
    void jetonUrlSafeAllerRetour() {
        byte[] data = {1, 2, (byte) 250, (byte) 255, 62, 63};
        String enc = JetonUtils.encoderUrl(data);
        assertThat(enc).doesNotContain("+", "/", "=");
        assertThat(JetonUtils.decoderUrl(enc)).isEqualTo(data);
    }

    @Test
    void tauxDePresence() {
        assertThat(StatistiquesUtils.calculerTauxPresence(0, 0)).isZero();
        assertThat(StatistiquesUtils.calculerTauxPresence(25, 100)).isEqualTo(25.0);
    }

    @Test
    void expirationParDefaut48h() {
        LocalDateTime t = LocalDateTime.of(2026, 12, 1, 10, 0);
        assertThat(DelaiExpirationUtils.calculerExpiration(t)).isEqualTo(t.plusHours(48));
    }

    @Test
    void emailNormalise() {
        assertThat(EmailNormaliseur.normaliser("  Parent@Test.TG ")).isEqualTo("parent@test.tg");
        assertThat(EmailNormaliseur.normaliser(null)).isNull();
    }

    @Test
    void telephoneE164() {
        assertThat(TelephoneUtils.formaterE164(null)).isNull();
        assertThat(TelephoneUtils.formaterE164("  ")).isNull();
        assertThatThrownBy(() -> TelephoneUtils.formaterE164("12")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> TelephoneUtils.formaterE164("abc")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void referencePaiementNormalisee() {
        assertThat(ReferencePaiementUtils.normaliser(" mp 24 ab-1 ")).isEqualTo("MP24AB-1");
        assertThat(ReferencePaiementUtils.normaliser(null)).isNull();
    }

    @Test
    void empreinteSha256Stable() {
        String a = EmpreinteUtils.calculerSha256("x".getBytes());
        assertThat(a).hasSize(64).isEqualTo(EmpreinteUtils.calculerSha256("x".getBytes()))
                .isNotEqualTo(EmpreinteUtils.calculerSha256("y".getBytes()));
    }

    @Test
    void montantFigeEtPositif() {
        Montant m = Montant.of(new BigDecimal("5000"), "XOF");
        assertThat(m.valeur()).isEqualByComparingTo("5000.00");
        assertThatThrownBy(() -> Montant.of(new BigDecimal("-1"), "XOF")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void transitionsDeReservation() {
        assertThat(StatutInscription.EN_ATTENTE_PAIEMENT.peutPasserA(StatutInscription.PREUVE_ENVOYEE)).isTrue();
        assertThat(StatutInscription.REJETEE.peutPasserA(StatutInscription.PREUVE_ENVOYEE)).isTrue(); // EF-23
        assertThat(StatutInscription.CONFIRMEE.peutPasserA(StatutInscription.ANNULEE)).isTrue();      // RG-19
        assertThat(StatutInscription.CONFIRMEE.peutPasserA(StatutInscription.EN_ATTENTE_PAIEMENT)).isFalse();
        assertThat(StatutInscription.ANNULEE.peutPasserA(StatutInscription.CONFIRMEE)).isFalse();
        assertThat(StatutInscription.EXPIREE.peutPasserA(StatutInscription.PREUVE_ENVOYEE)).isFalse();
    }

    @Test
    void gabaritsEmailEchappentLeContenu() {
        assertThat(GabaritsEmail.otp("123456")).contains("123456").contains("5 minutes");
        String html = GabaritsEmail.preuveRejetee("<b>Gala</b>", "<script>x</script>", "http://localhost");
        assertThat(html).doesNotContain("<script>").contains("&lt;script&gt;");
        assertThat(GabaritsEmail.reinitialisation("http://x/y?jeton=1")).contains("http://x/y?jeton=1");
        assertThat(GabaritsEmail.evenementAnnule("Gala", LocalDateTime.of(2026, 12, 5, 18, 30), "Météo", true, "admin@ipnet.tg"))
                .contains("Gala").containsIgnoringCase("M&eacute;t&eacute;o");
        assertThat(GabaritsEmail.evenementAnnule("Gala", LocalDateTime.of(2026, 12, 5, 18, 30), null, false, null)).contains("Gala");
        assertThat(GabaritsEmail.billet("Gala", LocalDateTime.of(2026, 12, 5, 18, 30), "Lomé", "Doe", "Jane", "http://localhost"))
                .contains("Doe").contains("Jane");
        assertThat(GabaritsEmail.test()).isNotBlank();
        assertThat(GabaritsEmail.alerteEchec("OTP", "a@b.tg", "boom", "http://localhost")).contains("a@b.tg");
        assertThat(GabaritsEmail.date(null)).isEmpty();
    }
}
