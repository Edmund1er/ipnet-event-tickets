package tg.ipnetinstitute.technology.features.identite;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.PhoneNumberUtil.PhoneNumberType;
import com.google.i18n.phonenumbers.Phonenumber;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import tg.ipnetinstitute.technology.common.exception.OtpInvalideException;
import tg.ipnetinstitute.technology.features.identite.dto.request.DemandeInscription;
import tg.ipnetinstitute.technology.features.identite.model.CategorieVisiteur;
import tg.ipnetinstitute.technology.features.identite.model.TypeProfil;
import tg.ipnetinstitute.technology.features.identite.repository.CategorieVisiteurRepository;
import tg.ipnetinstitute.technology.features.identite.repository.InscriptionEnAttenteRepository;
import tg.ipnetinstitute.technology.features.identite.repository.UtilisateurRepository;
import tg.ipnetinstitute.technology.features.identite.service.ServiceInscription;
import tg.ipnetinstitute.technology.features.notification.model.ModeleNotification;
import tg.ipnetinstitute.technology.features.notification.repository.OutboxNotificationRepository;

import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/**
 * RG-01 / RG-03 : le compte n'est créé qu'une fois le code e-mail validé.
 * Un faux e-mail (jamais confirmé) ne produit aucun compte, donc aucun accès.
 */
@SpringBootTest
class InscriptionEnDeuxTempsTest {

    @Autowired ServiceInscription inscription;
    @Autowired UtilisateurRepository utilisateurs;
    @Autowired InscriptionEnAttenteRepository enAttente;
    @Autowired CategorieVisiteurRepository categories;
    @Autowired OutboxNotificationRepository outbox;
    @Autowired ObjectMapper objectMapper;

    @MockitoBean JavaMailSender mailSender;

    @BeforeEach
    void smtp() {
        when(mailSender.createMimeMessage()).thenAnswer(i -> new MimeMessage(Session.getInstance(new Properties())));
    }

    @Test
    void aucunCompteTantQueLeCodeNEstPasValide() {
        Long categorieId = categories.save(new CategorieVisiteur("TEST_INSC_A", "Test A")).getId();
        String email = "faux.email@test.tg";
        inscription.demander(demande(email, numeroTogo(10), categorieId));

        assertThat(utilisateurs.existsByEmail(email)).isFalse();
        assertThat(enAttente.findByEmail(email)).isPresent();

        // Cinq mauvais codes épuisent les essais : même le bon code est ensuite refusé (RG-03)
        for (int i = 0; i < 5; i++) {
            assertThatThrownBy(() -> inscription.confirmer(email, "000000")).isInstanceOf(OtpInvalideException.class);
        }
        String bonCode = dernierCode(email);
        assertThatThrownBy(() -> inscription.confirmer(email, bonCode))
                .isInstanceOf(OtpInvalideException.class)
                .hasMessageContaining("essais");
        assertThat(utilisateurs.existsByEmail(email)).isFalse();
    }

    @Test
    void leBonCodeCreeLeCompteVerifieEtSeConsomme() {
        Long categorieId = categories.save(new CategorieVisiteur("TEST_INSC_B", "Test B")).getId();
        String email = "vrai.email@test.tg";
        inscription.demander(demande(email, numeroTogo(11), categorieId));

        Long id = inscription.confirmer(email, dernierCode(email));

        var compte = utilisateurs.findById(id).orElseThrow();
        assertThat(compte.isEmailVerifie()).isTrue();
        assertThat(compte.getEmail()).isEqualTo(email);
        assertThat(enAttente.findByEmail(email)).isEmpty();
        // Le code est à usage unique
        assertThatThrownBy(() -> inscription.confirmer(email, "123456")).isInstanceOf(OtpInvalideException.class);
    }

    private String dernierCode(String email) {
        var notif = outbox.findAll().stream()
                .filter(n -> n.getModele() == ModeleNotification.OTP && n.getDestinataire().equals(email))
                .reduce((a, b) -> b).orElseThrow();
        try {
            return objectMapper.readTree(notif.getCharge()).path("code").asText();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static DemandeInscription demande(String email, String telephone, Long categorieId) {
        return new DemandeInscription(email, telephone, "MotDePasseTest2026", TypeProfil.VISITEUR,
                null, null, categorieId, null, "Doe", "Jane");
    }

    private static String numeroTogo(int rang) {
        var util = PhoneNumberUtil.getInstance();
        long depart = util.getExampleNumberForType("TG", PhoneNumberType.MOBILE).getNationalNumber();
        int trouves = -1;
        for (long candidat = depart; candidat < depart + 1000; candidat++) {
            var n = new Phonenumber.PhoneNumber().setCountryCode(228).setNationalNumber(candidat);
            if (util.isValidNumber(n) && util.getNumberType(n) == PhoneNumberType.MOBILE && ++trouves == rang) {
                return util.format(n, PhoneNumberUtil.PhoneNumberFormat.E164);
            }
        }
        throw new IllegalStateException("Aucun numéro");
    }
}
