package tg.ipnetinstitute.technology.features;

import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.PhoneNumberUtil.PhoneNumberType;
import com.google.i18n.phonenumbers.Phonenumber;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import tg.ipnetinstitute.technology.common.exception.EvenementNonReservableException;
import tg.ipnetinstitute.technology.features.billet.repository.BilletRepository;
import tg.ipnetinstitute.technology.features.billet.wrapper.HmacWrapper;
import tg.ipnetinstitute.technology.features.controle.model.ResultatScan;
import tg.ipnetinstitute.technology.features.controle.service.ServiceControle;
import tg.ipnetinstitute.technology.features.evenement.dto.request.DemandeActivite;
import tg.ipnetinstitute.technology.features.evenement.dto.request.DemandeEvenement;
import tg.ipnetinstitute.technology.features.evenement.dto.response.EvenementResume;
import tg.ipnetinstitute.technology.features.evenement.model.StatutEvenement;
import tg.ipnetinstitute.technology.features.evenement.model.TypeEvenement;
import tg.ipnetinstitute.technology.features.evenement.service.ServiceEvenement;
import tg.ipnetinstitute.technology.features.evenement.service.ServiceProgramme;
import tg.ipnetinstitute.technology.features.evenement.utils.FiltresEvenementUtils;
import tg.ipnetinstitute.technology.features.identite.model.Role;
import tg.ipnetinstitute.technology.features.identite.model.TypeProfil;
import tg.ipnetinstitute.technology.features.identite.model.Utilisateur;
import tg.ipnetinstitute.technology.features.identite.repository.UtilisateurRepository;
import tg.ipnetinstitute.technology.features.paiement.repository.PaiementRepository;
import tg.ipnetinstitute.technology.features.paiement.service.ServicePaiement;
import tg.ipnetinstitute.technology.features.parametrage.dto.ParametresDto.ModificationPaiement;
import tg.ipnetinstitute.technology.features.parametrage.service.ServiceParametres;
import tg.ipnetinstitute.technology.features.reservation.model.StatutInscription;
import tg.ipnetinstitute.technology.features.reservation.repository.InscriptionRepository;
import tg.ipnetinstitute.technology.features.reservation.service.ServiceReservation;
import tg.ipnetinstitute.technology.support.PostgresEmbarque;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Properties;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/** Programme multi-jours : cadre, activités (payantes, gratuites, libres) et pass, de la réservation au contrôle. */
@SpringBootTest(properties = {"app.premier-evenement.actif=false", "app.notification.intervalle-ms=3600000"})
class ProgrammeActivitesTest {

    @DynamicPropertySource
    static void base(DynamicPropertyRegistry r) {
        PostgresEmbarque.brancher(r);
    }

    @Autowired UtilisateurRepository utilisateurs;
    @Autowired ServiceEvenement serviceEvenement;
    @Autowired ServiceProgramme serviceProgramme;
    @Autowired ServiceReservation serviceReservation;
    @Autowired ServicePaiement servicePaiement;
    @Autowired ServiceControle serviceControle;
    @Autowired ServiceParametres serviceParametres;
    @Autowired InscriptionRepository inscriptions;
    @Autowired PaiementRepository paiements;
    @Autowired BilletRepository billets;
    @Autowired HmacWrapper signateur;

    @MockitoBean JavaMailSender mailSender;

    private static Long adminId;
    private static final AtomicInteger SEQ = new AtomicInteger(3000);

    @BeforeAll
    static void init() {
        SecurityContextHolder.clearContext();
    }

    private void agir(Long id, String role) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(id, null, List.of(new SimpleGrantedAuthority(role))));
    }

    private synchronized Long admin() {
        if (adminId == null) {
            when(mailSender.createMimeMessage()).thenAnswer(i -> new MimeMessage(Session.getInstance(new Properties())));
            adminId = nouvelUtilisateur(Role.ADMIN, TypeProfil.AUCUN);
            agir(adminId, "ROLE_ADMIN");
            serviceParametres.modifierPaiement(new ModificationPaiement(numeroTogo(2999), null, "IPNET"), adminId);
        }
        return adminId;
    }

    private Long nouvelUtilisateur(Role role, TypeProfil type) {
        int n = SEQ.incrementAndGet();
        Utilisateur u = Utilisateur.nouveau("p" + n + "@test.tg", numeroTogo(n), "hash", type, role);
        u.validerEmail();
        return utilisateurs.save(u).getId();
    }

    /** Programme publié : de maintenant + 1 h à maintenant + 3 jours. */
    private EvenementResume cadrePublie() {
        Long a = admin();
        agir(a, "ROLE_ADMIN");
        var cadre = serviceEvenement.creer(new DemandeEvenement("Semaine " + SEQ.incrementAndGet(), "d",
                LocalDateTime.now().plusHours(1), "Campus", BigDecimal.ZERO, "XOF", 1, null,
                LocalDateTime.now().plusDays(3), "CADRE"), a);
        return cadre;
    }

    private DemandeActivite activite(String titre, LocalDateTime debut, BigDecimal prix, Integer capacite, boolean libre) {
        return new DemandeActivite("ACTIVITE", titre, null, "SPORT", debut, debut.plusHours(1), null, prix, capacite,
                libre, null, null, null, null, null);
    }

    private Long reserverEtConfirmer(Long participant, Long evenementId) {
        agir(participant, "ROLE_PARTICIPANT");
        Long inscriptionId = serviceReservation.reserver(participant, evenementId).id();
        servicePaiement.soumettrePreuve(inscriptionId, participant, "REF-PRG-" + SEQ.incrementAndGet(), null);
        Long a = admin();
        agir(a, "ROLE_ADMIN");
        servicePaiement.valider(paiements.findByInscriptionId(inscriptionId).orElseThrow().getId(), a);
        return inscriptionId;
    }

    private String jeton(Long inscriptionId) {
        var billet = billets.findByInscriptionId(inscriptionId).orElseThrow();
        var insc = inscriptions.findById(inscriptionId).orElseThrow();
        return signateur.signer(billet.getId(), billet.getNonce(), insc.getEvenementId());
    }

    @Test
    void cadreNonReservable_etListesGeneralesSansActivites() {
        var cadre = cadrePublie();
        Long a = admin();
        agir(a, "ROLE_ADMIN");
        var act = serviceProgramme.creerActivite(cadre.id(),
                activite("Tournoi", LocalDateTime.now().plusHours(3), new BigDecimal("1000"), 20, false), a);
        serviceEvenement.publier(cadre.id(), a);

        Long p = nouvelUtilisateur(Role.PARTICIPANT, TypeProfil.VISITEUR);
        agir(p, "ROLE_PARTICIPANT");
        assertThatThrownBy(() -> serviceReservation.reserver(p, cadre.id())).isInstanceOf(EvenementNonReservableException.class);

        var liste = serviceEvenement.listerPublies(new FiltresEvenementUtils.Filtre(null, null, null, null, null), Pageable.unpaged());
        assertThat(liste.getContent()).extracting(EvenementResume::id).contains(cadre.id()).doesNotContain(act.id());
        var avecActivites = serviceEvenement.listerPublies(new FiltresEvenementUtils.Filtre(null, null, null, null, null), Pageable.unpaged(), true);
        assertThat(avecActivites.getContent()).extracting(EvenementResume::id).contains(act.id());
        // Publier le programme a publié son activité
        assertThat(serviceEvenement.consulter(act.id()).statut()).isEqualTo(StatutEvenement.PUBLIE);
    }

    @Test
    void activiteHorsDuProgramme_refusee() {
        var cadre = cadrePublie();
        Long a = admin();
        agir(a, "ROLE_ADMIN");
        assertThatThrownBy(() -> serviceProgramme.creerActivite(cadre.id(),
                activite("Trop tard", LocalDateTime.now().plusDays(10), new BigDecimal("500"), 5, false), a))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void inscriptionGratuite_confirmeeSansPaiement_avecBillet() {
        var cadre = cadrePublie();
        Long a = admin();
        agir(a, "ROLE_ADMIN");
        var act = serviceProgramme.creerActivite(cadre.id(),
                activite("Jeux de société", LocalDateTime.now().plusHours(4), BigDecimal.ZERO, 10, false), a);
        serviceEvenement.publier(cadre.id(), a);

        Long p = nouvelUtilisateur(Role.PARTICIPANT, TypeProfil.VISITEUR);
        agir(p, "ROLE_PARTICIPANT");
        var r = serviceReservation.reserver(p, act.id());

        assertThat(r.statut()).isEqualTo(StatutInscription.CONFIRMEE);
        assertThat(billets.findByInscriptionId(r.id())).isPresent();
        assertThat(serviceEvenement.consulter(act.id()).placesReservees()).isEqualTo(1);
    }

    @Test
    void accesLibre_nonReservable() {
        var cadre = cadrePublie();
        Long a = admin();
        agir(a, "ROLE_ADMIN");
        var act = serviceProgramme.creerActivite(cadre.id(),
                activite("Exposition", LocalDateTime.now().plusHours(5), BigDecimal.ZERO, null, true), a);
        serviceEvenement.publier(cadre.id(), a);

        Long p = nouvelUtilisateur(Role.PARTICIPANT, TypeProfil.VISITEUR);
        agir(p, "ROLE_PARTICIPANT");
        assertThatThrownBy(() -> serviceReservation.reserver(p, act.id())).isInstanceOf(EvenementNonReservableException.class);
    }

    @Test
    void passGlobal_ouvreToutesLesActivites_uneEntreeParActivite() {
        var cadre = cadrePublie();
        Long a = admin();
        agir(a, "ROLE_ADMIN");
        var a1 = serviceProgramme.creerActivite(cadre.id(), activite("Concert", LocalDateTime.now().plusHours(3), new BigDecimal("2000"), 50, false), a);
        var a2 = serviceProgramme.creerActivite(cadre.id(), activite("Tournoi", LocalDateTime.now().plusDays(1), new BigDecimal("1000"), 50, false), a);
        var pass = serviceProgramme.creerActivite(cadre.id(), new DemandeActivite("PASS", "Pass complet", null, null,
                cadre.dateDebut(), cadre.dateFin(), null, new BigDecimal("5000"), 30, false, "GLOBAL", null, null, null, null), a);
        serviceEvenement.publier(cadre.id(), a);
        assertThat(serviceEvenement.consulter(pass.id()).type()).isEqualTo(TypeEvenement.PASS);

        Long etranger = serviceEvenement.creer(new DemandeEvenement("Autre " + SEQ.incrementAndGet(), "d",
                LocalDateTime.now().plusDays(5), "Lomé", new BigDecimal("1000"), "XOF", 10), a).id();
        serviceEvenement.publier(etranger, a);

        Long p = nouvelUtilisateur(Role.PARTICIPANT, TypeProfil.ETUDIANT);
        Long insc = reserverEtConfirmer(p, pass.id());
        String jeton = jeton(insc);
        Long agent = nouvelUtilisateur(Role.SCANNER, TypeProfil.AUCUN);
        agir(agent, "ROLE_SCANNER");

        assertThat(serviceControle.scanner(jeton, a1.id(), agent)).isInstanceOf(ResultatScan.Accepte.class);
        assertThat(serviceControle.scanner(jeton, a1.id(), agent)).isInstanceOf(ResultatScan.DejaUtilise.class);
        assertThat(serviceControle.scanner(jeton, a2.id(), agent)).isInstanceOf(ResultatScan.Accepte.class);
        assertThat(serviceControle.scanner(jeton, etranger, agent)).isInstanceOf(ResultatScan.MauvaisEvenement.class);
    }

    @Test
    void annulationDuProgramme_annuleActivitesEtPass() {
        var cadre = cadrePublie();
        Long a = admin();
        agir(a, "ROLE_ADMIN");
        var act = serviceProgramme.creerActivite(cadre.id(), activite("Danse", LocalDateTime.now().plusHours(6), new BigDecimal("500"), 10, false), a);
        serviceEvenement.publier(cadre.id(), a);
        serviceEvenement.annuler(cadre.id(), a, "Imprévu");
        assertThat(serviceEvenement.consulter(act.id()).statut()).isEqualTo(StatutEvenement.ANNULE);
    }

    @Test
    void evenementPasse_masqueDefinitivement_disparaitDesListes() {
        Long a = admin();
        agir(a, "ROLE_ADMIN");
        var filtre = new FiltresEvenementUtils.Filtre(null, null, null, null, null);
        var futur = serviceEvenement.creer(new DemandeEvenement("A venir " + SEQ.incrementAndGet(), "d",
                LocalDateTime.now().plusDays(4), "Lomé", new BigDecimal("1000"), "XOF", 10), a);
        assertThatThrownBy(() -> serviceEvenement.masquer(futur.id(), a)).isInstanceOf(IllegalStateException.class);

        var passe = serviceEvenement.creer(new DemandeEvenement("Passe " + SEQ.incrementAndGet(), "d",
                LocalDateTime.now().minusDays(2), "Lomé", new BigDecimal("1000"), "XOF", 10), a);
        assertThat(serviceEvenement.consulter(passe.id()).passe()).isTrue();
        serviceEvenement.masquer(passe.id(), a);

        assertThat(serviceEvenement.listerAdmin(null, filtre, Pageable.unpaged()).getContent())
                .extracting(EvenementResume::id).contains(futur.id()).doesNotContain(passe.id());
        assertThatThrownBy(() -> serviceEvenement.consulterPublic(passe.id()))
                .isInstanceOf(tg.ipnetinstitute.technology.common.exception.RessourceIntrouvableException.class);
    }

    @Test
    void listePublique_cacheLesEvenementsPasses() {
        Long a = admin();
        agir(a, "ROLE_ADMIN");
        var filtre = new FiltresEvenementUtils.Filtre(null, null, null, null, null);
        var encours = serviceEvenement.creer(new DemandeEvenement("Demain " + SEQ.incrementAndGet(), "d",
                LocalDateTime.now().plusDays(1), "Lomé", new BigDecimal("1000"), "XOF", 10), a);
        serviceEvenement.publier(encours.id(), a);
        assertThat(serviceEvenement.listerPublies(filtre, Pageable.unpaged()).getContent())
                .extracting(EvenementResume::id).contains(encours.id());
    }

    private static String numeroTogo(int rang) {
        var util = PhoneNumberUtil.getInstance();
        long depart = util.getExampleNumberForType("TG", PhoneNumberType.MOBILE).getNationalNumber();
        int trouves = -1;
        for (long candidat = depart; candidat < depart + 100000; candidat++) {
            var n = new Phonenumber.PhoneNumber().setCountryCode(228).setNationalNumber(candidat);
            if (util.isValidNumber(n) && util.getNumberType(n) == PhoneNumberType.MOBILE && ++trouves == rang) {
                return util.format(n, PhoneNumberUtil.PhoneNumberFormat.E164);
            }
        }
        throw new IllegalStateException("Aucun numéro " + rang);
    }
}
