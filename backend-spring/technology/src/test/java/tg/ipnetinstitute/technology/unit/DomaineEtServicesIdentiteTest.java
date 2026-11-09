package tg.ipnetinstitute.technology.unit;

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
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import tg.ipnetinstitute.technology.common.exception.CapaciteAtteinteException;
import tg.ipnetinstitute.technology.common.exception.DateEvenementPasseeException;
import tg.ipnetinstitute.technology.common.exception.EmailDejaUtiliseException;
import tg.ipnetinstitute.technology.common.exception.EmailInvalideException;
import tg.ipnetinstitute.technology.common.exception.EvenementNonReservableException;
import tg.ipnetinstitute.technology.common.exception.OtpInvalideException;
import tg.ipnetinstitute.technology.common.exception.TelephoneDejaUtiliseException;
import tg.ipnetinstitute.technology.common.exception.TransitionEvenementIllegaleException;
import tg.ipnetinstitute.technology.common.utils.Email;
import tg.ipnetinstitute.technology.common.validation.email.ValidateurEmail;
import tg.ipnetinstitute.technology.features.evenement.model.Evenement;
import tg.ipnetinstitute.technology.features.evenement.model.StatutEvenement;
import tg.ipnetinstitute.technology.features.identite.dto.request.DemandeInscription;
import tg.ipnetinstitute.technology.features.identite.dto.request.ModificationProfilRequest;
import tg.ipnetinstitute.technology.features.identite.model.CategorieVisiteur;
import tg.ipnetinstitute.technology.features.identite.model.Filiere;
import tg.ipnetinstitute.technology.features.identite.model.Role;
import tg.ipnetinstitute.technology.features.identite.model.TypeProfil;
import tg.ipnetinstitute.technology.features.identite.model.Utilisateur;
import tg.ipnetinstitute.technology.features.identite.repository.CategorieVisiteurRepository;
import tg.ipnetinstitute.technology.features.identite.repository.FiliereRepository;
import tg.ipnetinstitute.technology.features.identite.repository.UtilisateurRepository;
import tg.ipnetinstitute.technology.features.identite.service.ServiceAuthentification;
import tg.ipnetinstitute.technology.features.identite.service.ServiceIdentite;
import tg.ipnetinstitute.technology.features.identite.service.ServiceInscription;
import tg.ipnetinstitute.technology.features.identite.service.ServiceVerificationEmail;
import tg.ipnetinstitute.technology.features.notification.model.ModeleNotification;
import tg.ipnetinstitute.technology.features.notification.repository.OutboxNotificationRepository;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/** Règles du domaine (événement, utilisateur, e-mail) et services d'identité : inscription étudiant, profil, e-mail, suppression. */
@SpringBootTest
class DomaineEtServicesIdentiteTest {

    @Autowired ServiceInscription inscription;
    @Autowired ServiceIdentite identite;
    @Autowired ServiceAuthentification authentification;
    @Autowired ServiceVerificationEmail verificationEmail;
    @Autowired ValidateurEmail validateurEmail;
    @Autowired UtilisateurRepository utilisateurs;
    @Autowired FiliereRepository filieres;
    @Autowired CategorieVisiteurRepository categories;
    @Autowired OutboxNotificationRepository outbox;
    @Autowired ObjectMapper objectMapper;
    @MockitoBean JavaMailSender mailSender;

    @BeforeEach
    void smtp() {
        when(mailSender.createMimeMessage()).thenAnswer(i -> new MimeMessage(Session.getInstance(new Properties())));
    }

    // ------------------------------------------------------------- événement

    private Evenement evt(int capacite) {
        return Evenement.creer("Gala", "d", LocalDateTime.now().plusDays(3), "Lomé", new BigDecimal("1000"), "XOF", capacite, 1L);
    }

    @Test
    void cycleDeVieEvenement() {
        Evenement e = evt(1);
        assertThat(e.getStatut()).isEqualTo(StatutEvenement.BROUILLON);
        assertThatThrownBy(e::reserverPlace).isInstanceOf(EvenementNonReservableException.class);
        assertThatThrownBy(e::terminer).isInstanceOf(TransitionEvenementIllegaleException.class);
        e.publier(Clock.systemDefaultZone());
        e.reserverPlace();
        assertThatThrownBy(e::reserverPlace).isInstanceOf(CapaciteAtteinteException.class);
        e.libererPlace();
        e.libererPlace();
        assertThat(e.getPlacesReservees()).isZero();
        e.modifier("Nouveau", null, LocalDateTime.now().plusDays(5), null, BigDecimal.ZERO, "XOF", 10);
        assertThat(e.getTitre()).isEqualTo("Nouveau");
        e.terminer();
        assertThat(e.getStatut()).isEqualTo(StatutEvenement.TERMINE);
        assertThatThrownBy(e::annuler).isInstanceOf(TransitionEvenementIllegaleException.class);
    }

    @Test
    void evenementInvalide() {
        assertThatThrownBy(() -> evt(0)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> Evenement.creer("t", null, LocalDateTime.now(), null, new BigDecimal("-1"), "XOF", 1, 1L))
                .isInstanceOf(IllegalArgumentException.class);
        Evenement passe = Evenement.creer("t", null, LocalDateTime.now().minusDays(1), null, BigDecimal.ONE, "XOF", 1, 1L);
        assertThatThrownBy(() -> passe.publier(Clock.systemDefaultZone())).isInstanceOf(DateEvenementPasseeException.class);
        Evenement e = evt(2);
        e.publier(Clock.systemDefaultZone());
        e.reserverPlace();
        e.reserverPlace();
        assertThatThrownBy(() -> e.modifier("t", null, LocalDateTime.now().plusDays(1), null, BigDecimal.ONE, "XOF", 1))
                .isInstanceOf(IllegalArgumentException.class);
        e.annuler();
        assertThat(e.getStatut()).isEqualTo(StatutEvenement.ANNULE);
    }

    // ------------------------------------------------------------ utilisateur

    @Test
    void verrouillageApresCinqEchecs() {
        Utilisateur u = Utilisateur.nouveau("v@test.tg", "+22890000000", "h", TypeProfil.VISITEUR, Role.PARTICIPANT);
        for (int i = 0; i < 4; i++) u.enregistrerEchecConnexion();
        assertThat(u.estVerrouille(LocalDateTime.now())).isFalse();
        u.enregistrerEchecConnexion();
        assertThat(u.estVerrouille(LocalDateTime.now())).isTrue();
        assertThat(u.estVerrouille(LocalDateTime.now().plusMinutes(16))).isFalse();
        assertThat(u.getTentativesEchec()).isZero();
        u.desactiver();
        assertThat(u.isActif()).isFalse();
        u.activer();
        u.changerTelephone("+22890000001");
        assertThat(u.isTelephoneVerifie()).isFalse();
        assertThat(u.isEmailVerifie()).isFalse();
        u.changerEmail("n@test.tg");
        assertThat(u.isEmailVerifie()).isTrue();
        u.anonymiser("x");
        assertThat(u.isActif()).isFalse();
    }

    @Test
    void emailInvalideRefuse() {
        assertThatThrownBy(() -> validateurEmail.normaliser("pas-un-email")).isInstanceOf(EmailInvalideException.class);
        assertThatThrownBy(() -> validateurEmail.normaliser("a@b")).isInstanceOf(EmailInvalideException.class);
        assertThatThrownBy(() -> validateurEmail.normaliser("Nom <a@b.tg>")).isInstanceOf(EmailInvalideException.class);
        assertThat(validateurEmail.normaliser("  Valide@Test.TG ")).isEqualTo("valide@test.tg");
        assertThatThrownBy(() -> new Email("x")).isInstanceOf(EmailInvalideException.class);
    }

    // ------------------------------------------- inscription étudiant + profil

    @Test
    void inscriptionEtudiantProfilEtSuppression() throws Exception {
        Filiere gl = filieres.save(new Filiere("Filière test"));
        String email = "etudiant.test@test.tg";
        int annee = Year.now().getValue();
        inscription.demander(new DemandeInscription(email, numero(40), "MotDePasseEtu2026", TypeProfil.ETUDIANT,
                gl.getId(), annee - 2, null, null, "Kossi", "Ama"));
        Long id = inscription.confirmer(email, dernierCode(email));

        var profil = identite.profil(id);
        assertThat(profil.etudiant().filiereModifiable()).isFalse(); // L3 : verrouillée
        assertThat(profil.nom()).isEqualTo("Kossi");
        assertThat(identite.resumer(id).detail()).isEqualTo("Filière test");

        // Connexion possible, mauvais mot de passe refusé
        assertThat(authentification.connecter(new Email(email), "MotDePasseEtu2026").accessToken()).isNotBlank();
        assertThatThrownBy(() -> authentification.connecter(new Email(email), "mauvais-mot-de-passe")).isInstanceOf(BadCredentialsException.class);

        // Modification : nom, prénom, téléphone (aucune adresse)
        var maj = identite.modifierProfil(id, new ModificationProfilRequest("Nouveau", "Nom", numero(41), null));
        assertThat(maj.nom()).isEqualTo("Nouveau");
        assertThatThrownBy(() -> identite.modifierProfil(id, new ModificationProfilRequest(" ", "Nom", numero(41), null)))
                .isInstanceOf(IllegalArgumentException.class);

        // Suppression : mot de passe exigé, puis anonymisation
        assertThatThrownBy(() -> identite.supprimerCompte(id, "faux")).isInstanceOf(IllegalArgumentException.class);
        identite.supprimerCompte(id, "MotDePasseEtu2026");
        assertThat(utilisateurs.findById(id).orElseThrow().isActif()).isFalse();
        assertThat(utilisateurs.findById(id).orElseThrow().getEmail()).endsWith("@anonyme.invalid");
    }

    @Test
    void doublonsEtChangementEmail() throws Exception {
        Long cat = categories.save(new CategorieVisiteur("TEST_DBL", "Doublon")).getId();
        String email = "doublon@test.tg";
        String tel = numero(42);
        inscription.demander(new DemandeInscription(email, tel, "MotDePasseDbl2026", TypeProfil.VISITEUR, null, null, cat, "ACME", "Doe", "Jane"));
        Long id = inscription.confirmer(email, dernierCode(email));

        assertThatThrownBy(() -> inscription.demander(new DemandeInscription(email, numero(43), "MotDePasseDbl2026",
                TypeProfil.VISITEUR, null, null, cat, null, "A", "B"))).isInstanceOf(EmailDejaUtiliseException.class);
        assertThatThrownBy(() -> inscription.demander(new DemandeInscription("autre.doublon@test.tg", tel, "MotDePasseDbl2026",
                TypeProfil.VISITEUR, null, null, cat, null, "A", "B"))).isInstanceOf(TelephoneDejaUtiliseException.class);
        assertThat(identite.profil(id).visiteur().organisation()).isEqualTo("ACME");
        assertThat(identite.resumer(id).detail()).contains("Doublon").contains("ACME");

        // EF-08 : changement d'e-mail confirmé par un code reçu sur la NOUVELLE adresse
        verificationEmail.demanderChangement(id, "nouvelle.adresse@test.tg");
        assertThatThrownBy(() -> verificationEmail.confirmerChangement(id, "000000")).isInstanceOf(OtpInvalideException.class);
        String code = dernierCode("nouvelle.adresse@test.tg");
        assertThat(verificationEmail.confirmerChangement(id, code)).isEqualTo("nouvelle.adresse@test.tg");
        assertThatThrownBy(() -> verificationEmail.demanderChangement(id, "nouvelle.adresse@test.tg")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> verificationEmail.envoyerCode(id)).isInstanceOf(IllegalStateException.class); // déjà vérifiée
    }

    @Test
    void renvoiTropRapprocheRefuse() {
        Long cat = categories.save(new CategorieVisiteur("TEST_RNV", "Renvoi")).getId();
        String email = "renvoi@test.tg";
        inscription.demander(new DemandeInscription(email, numero(44), "MotDePasseRnv2026", TypeProfil.VISITEUR, null, null, cat, null, "A", "B"));
        assertThatThrownBy(() -> inscription.renvoyer(email)).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> inscription.renvoyer("inconnu@test.tg")).isInstanceOf(OtpInvalideException.class);
    }

    // -------------------------------------------------------------- outils

    private String dernierCode(String email) throws Exception {
        var notif = outbox.findAll().stream()
                .filter(n -> n.getModele() == ModeleNotification.OTP && n.getDestinataire().equals(email))
                .reduce((a, b) -> b).orElseThrow();
        return objectMapper.readTree(notif.getCharge()).path("code").asText();
    }

    private static String numero(int rang) {
        var util = PhoneNumberUtil.getInstance();
        long depart = util.getExampleNumberForType("TG", PhoneNumberType.MOBILE).getNationalNumber();
        int trouves = -1;
        for (long c = depart; c < depart + 100000; c++) {
            var n = new Phonenumber.PhoneNumber().setCountryCode(228).setNationalNumber(c);
            if (util.isValidNumber(n) && util.getNumberType(n) == PhoneNumberType.MOBILE && ++trouves == rang) {
                return util.format(n, PhoneNumberUtil.PhoneNumberFormat.E164);
            }
        }
        throw new IllegalStateException();
    }
}
