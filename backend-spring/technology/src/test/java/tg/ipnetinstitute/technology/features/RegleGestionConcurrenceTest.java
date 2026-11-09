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
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import tg.ipnetinstitute.technology.common.exception.CapaciteAtteinteException;
import tg.ipnetinstitute.technology.common.exception.DejaInscritException;
import tg.ipnetinstitute.technology.common.exception.FiliereVerrouilleeException;
import tg.ipnetinstitute.technology.features.billet.repository.BilletRepository;
import tg.ipnetinstitute.technology.features.billet.wrapper.HmacWrapper;
import tg.ipnetinstitute.technology.features.controle.model.ResultatScan;
import tg.ipnetinstitute.technology.features.controle.service.ServiceControle;
import tg.ipnetinstitute.technology.features.evenement.dto.request.DemandeEvenement;
import tg.ipnetinstitute.technology.features.evenement.service.ServiceEvenement;
import tg.ipnetinstitute.technology.features.identite.model.Etudiant;
import tg.ipnetinstitute.technology.features.identite.model.Filiere;
import tg.ipnetinstitute.technology.features.identite.model.Role;
import tg.ipnetinstitute.technology.features.identite.model.TypeProfil;
import tg.ipnetinstitute.technology.features.identite.model.Utilisateur;
import tg.ipnetinstitute.technology.features.identite.repository.EtudiantRepository;
import tg.ipnetinstitute.technology.features.identite.repository.FiliereRepository;
import tg.ipnetinstitute.technology.features.identite.repository.UtilisateurRepository;
import tg.ipnetinstitute.technology.features.identite.service.ServiceProfilEtudiant;
import tg.ipnetinstitute.technology.features.paiement.dto.response.RapportRapprochementResponse;
import tg.ipnetinstitute.technology.features.paiement.model.StatutPaiement;
import tg.ipnetinstitute.technology.features.paiement.repository.PaiementRepository;
import tg.ipnetinstitute.technology.features.paiement.service.ServicePaiement;
import tg.ipnetinstitute.technology.features.parametrage.dto.ParametresDto.ModificationPaiement;
import tg.ipnetinstitute.technology.features.parametrage.service.ServiceParametres;
import tg.ipnetinstitute.technology.features.reservation.model.StatutInscription;
import tg.ipnetinstitute.technology.features.reservation.repository.InscriptionRepository;
import tg.ipnetinstitute.technology.features.reservation.service.ServiceReservation;
import tg.ipnetinstitute.technology.support.PostgresEmbarque;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/**
 * Règles de gestion et cas de test obligatoires du cahier (§10) sur un vrai PostgreSQL :
 * verrou de la dernière place, double scan simultané, RG-06, RG-13, RG-15, jeton altéré,
 * rapprochement du relevé (EF-26) et verrouillage de filière (EF-09 / RG-04).
 */
@SpringBootTest(properties = {"app.premier-evenement.actif=false", "app.notification.intervalle-ms=3600000"})
class RegleGestionConcurrenceTest {

    @DynamicPropertySource
    static void base(DynamicPropertyRegistry r) {
        PostgresEmbarque.brancher(r);
    }

    @Autowired UtilisateurRepository utilisateurs;
    @Autowired FiliereRepository filieres;
    @Autowired EtudiantRepository etudiants;
    @Autowired ServiceEvenement serviceEvenement;
    @Autowired ServiceReservation serviceReservation;
    @Autowired ServicePaiement servicePaiement;
    @Autowired ServiceControle serviceControle;
    @Autowired ServiceParametres serviceParametres;
    @Autowired ServiceProfilEtudiant serviceProfilEtudiant;
    @Autowired InscriptionRepository inscriptions;
    @Autowired PaiementRepository paiements;
    @Autowired BilletRepository billets;
    @Autowired HmacWrapper signateur;

    @MockitoBean JavaMailSender mailSender;

    private static Long adminId;
    private static final AtomicInteger SEQ = new AtomicInteger(100);

    @BeforeAll
    static void init() {
        SecurityContextHolder.clearContext();
    }

    // ---------------------------------------------------------------- outils

    private void agir(Long id, String role) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(id, null, List.of(new SimpleGrantedAuthority(role))));
    }

    private synchronized Long admin() {
        if (adminId == null) {
            when(mailSender.createMimeMessage()).thenAnswer(i -> new MimeMessage(Session.getInstance(new Properties())));
            adminId = nouvelUtilisateur(Role.ADMIN, TypeProfil.AUCUN);
            agir(adminId, "ROLE_ADMIN");
            serviceParametres.modifierPaiement(new ModificationPaiement(numeroTogo(0), null, "IPNET"), adminId);
        }
        return adminId;
    }

    private Long nouvelUtilisateur(Role role, TypeProfil type) {
        int n = SEQ.incrementAndGet();
        Utilisateur u = Utilisateur.nouveau("u" + n + "@test.tg", numeroTogo(n), "hash", type, role);
        u.validerEmail();
        return utilisateurs.save(u).getId();
    }

    private Long evenementPublie(int capacite) {
        Long a = admin();
        agir(a, "ROLE_ADMIN");
        var e = serviceEvenement.creer(new DemandeEvenement("Evt " + SEQ.incrementAndGet(), "d",
                LocalDateTime.now().plusDays(10), "Lomé", new BigDecimal("5000"), "XOF", capacite), a);
        serviceEvenement.publier(e.id(), a);
        return e.id();
    }

    private <T> List<Object> enParallele(List<Callable<T>> taches) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(taches.size());
        CountDownLatch depart = new CountDownLatch(1);
        List<Future<Object>> futurs = new ArrayList<>();
        for (Callable<T> t : taches) {
            futurs.add(pool.submit(() -> {
                depart.await();
                try {
                    return t.call();
                } catch (Throwable ex) {
                    return ex;
                }
            }));
        }
        depart.countDown();
        List<Object> resultats = new ArrayList<>();
        for (Future<Object> f : futurs) resultats.add(f.get());
        pool.shutdown();
        return resultats;
    }

    /** Réserve, soumet la référence puis fait valider le paiement par l'administrateur : renvoie l'id d'inscription. */
    private Long reserverEtConfirmer(Long participant, Long evenementId, String reference) {
        agir(participant, "ROLE_PARTICIPANT");
        Long inscriptionId = serviceReservation.reserver(participant, evenementId).id();
        serviceReservation.mesReservations(participant, org.springframework.data.domain.Pageable.unpaged());
        servicePaiement.soumettrePreuve(inscriptionId, participant, reference, null);
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

    // ----------------------------------------------------------------- tests

    @Test
    void deuxVisiteursSurLaDernierePlace_unSeulReussit() throws Exception {
        Long evt = evenementPublie(1);
        Long p1 = nouvelUtilisateur(Role.PARTICIPANT, TypeProfil.VISITEUR);
        Long p2 = nouvelUtilisateur(Role.PARTICIPANT, TypeProfil.VISITEUR);

        List<Object> res = enParallele(List.of(
                () -> { agir(p1, "ROLE_PARTICIPANT"); return serviceReservation.reserver(p1, evt); },
                () -> { agir(p2, "ROLE_PARTICIPANT"); return serviceReservation.reserver(p2, evt); }));

        assertThat(res.stream().filter(r -> !(r instanceof Throwable))).hasSize(1);
        assertThat(res.stream().filter(r -> r instanceof CapaciteAtteinteException)).hasSize(1);
        assertThat(serviceEvenement.consulter(evt).placesReservees()).isEqualTo(1);
    }

    @Test
    void pointeDe200ReservationsSimultanees_aucuneSurvente() throws Exception {
        int capacite = 40;
        Long evt = evenementPublie(capacite);
        List<Long> participants = new ArrayList<>();
        for (int i = 0; i < 200; i++) participants.add(nouvelUtilisateur(Role.PARTICIPANT, TypeProfil.VISITEUR));
        List<Callable<Object>> taches = participants.stream().<Callable<Object>>map(p -> () -> {
            agir(p, "ROLE_PARTICIPANT");
            return serviceReservation.reserver(p, evt);
        }).toList();

        List<Object> res = enParallele(taches);

        assertThat(res.stream().filter(r -> !(r instanceof Throwable))).hasSize(capacite);
        assertThat(serviceEvenement.consulter(evt).placesReservees()).isEqualTo(capacite);
        assertThat(inscriptions.count()).isGreaterThanOrEqualTo(capacite);
    }

    @Test
    void deuxiemeReservationDuMemeEvenement_refuseRG06() {
        Long evt = evenementPublie(10);
        Long p = nouvelUtilisateur(Role.PARTICIPANT, TypeProfil.ETUDIANT);
        agir(p, "ROLE_PARTICIPANT");
        serviceReservation.reserver(p, evt);
        assertThatThrownBy(() -> serviceReservation.reserver(p, evt)).isInstanceOf(DejaInscritException.class);
    }

    @Test
    void billetScanneDeuxFoisEnParallele_uneSeuleAcceptation() throws Exception {
        Long evt = evenementPublie(5);
        Long p = nouvelUtilisateur(Role.PARTICIPANT, TypeProfil.VISITEUR);
        Long insc = reserverEtConfirmer(p, evt, "REF-SCAN-" + SEQ.incrementAndGet());
        String jeton = jeton(insc);
        Long agent = nouvelUtilisateur(Role.SCANNER, TypeProfil.AUCUN);

        List<Object> res = enParallele(List.of(
                () -> { agir(agent, "ROLE_SCANNER"); return serviceControle.scanner(jeton, evt, agent); },
                () -> { agir(agent, "ROLE_SCANNER"); return serviceControle.scanner(jeton, evt, agent); }));

        long acceptes = res.stream().filter(r -> r instanceof ResultatScan.Accepte).count();
        long refuses = res.stream().filter(r -> r instanceof ResultatScan.DejaUtilise
                || r instanceof Throwable).count();
        assertThat(acceptes).isEqualTo(1);
        assertThat(refuses).isEqualTo(1);
    }

    @Test
    void jetonAltere_refuseInvalide() {
        Long evt = evenementPublie(5);
        Long p = nouvelUtilisateur(Role.PARTICIPANT, TypeProfil.VISITEUR);
        Long insc = reserverEtConfirmer(p, evt, "REF-ALT-" + SEQ.incrementAndGet());
        String jeton = jeton(insc);
        String altere = jeton.substring(0, jeton.length() - 2) + (jeton.endsWith("A") ? "BB" : "AA");
        Long agent = nouvelUtilisateur(Role.SCANNER, TypeProfil.AUCUN);
        agir(agent, "ROLE_SCANNER");

        assertThat(serviceControle.scanner(altere, evt, agent)).isInstanceOf(ResultatScan.Invalide.class);
        // Billet authentique présenté à un autre événement : refusé (EF-43)
        Long autre = evenementPublie(5);
        assertThat(serviceControle.scanner(jeton, autre, agent)).isInstanceOf(ResultatScan.MauvaisEvenement.class);
        // Et il reste valable pour son vrai événement
        assertThat(serviceControle.scanner(jeton, evt, agent)).isInstanceOf(ResultatScan.Accepte.class);
    }

    @Test
    void adminNePeutPasValiderSaPropreReservation_RG15() {
        Long evt = evenementPublie(5);
        // Cas limite : un compte portant le rôle ADMIN qui possède une réservation
        Long a = admin();
        Long inscriptionId = inscriptions.save(
                tg.ipnetinstitute.technology.features.reservation.model.Inscription.nouvelle(a, evt, 48, new BigDecimal("5000"), "XOF")).getId();
        var paiement = tg.ipnetinstitute.technology.features.paiement.model.Paiement.initialiser(inscriptionId, new BigDecimal("5000"), "XOF");
        paiement.soumettrePreuve("REF-RG15-" + SEQ.incrementAndGet(), null, null);
        Long paiementId = paiements.save(paiement).getId();
        var insc = inscriptions.findById(inscriptionId).orElseThrow();
        insc.transitionnerVers(StatutInscription.PREUVE_ENVOYEE, null);
        inscriptions.save(insc);

        agir(a, "ROLE_ADMIN");
        assertThatThrownBy(() -> servicePaiement.valider(paiementId, a)).isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void memeCaptureSurDeuxReservations_refuseRG13() {
        Long evt1 = evenementPublie(5);
        Long evt2 = evenementPublie(5);
        Long p1 = nouvelUtilisateur(Role.PARTICIPANT, TypeProfil.VISITEUR);
        Long p2 = nouvelUtilisateur(Role.PARTICIPANT, TypeProfil.VISITEUR);
        byte[] png = pngMinimal();
        agir(p1, "ROLE_PARTICIPANT");
        Long i1 = serviceReservation.reserver(p1, evt1).id();
        servicePaiement.soumettrePreuve(i1, p1, "REF-A-" + SEQ.incrementAndGet(), new MockMultipartFile("f", "c.png", "image/png", png));
        agir(p2, "ROLE_PARTICIPANT");
        Long i2 = serviceReservation.reserver(p2, evt2).id();
        assertThatThrownBy(() -> servicePaiement.soumettrePreuve(i2, p2, "REF-B-" + SEQ.incrementAndGet(),
                new MockMultipartFile("f", "c.png", "image/png", png)))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("RG-13");
    }

    @Test
    void releveCsv_confirmeAutomatiquementSeulementSiReferenceEtMontantCorrespondent() {
        Long evt = evenementPublie(5);
        Long ok = nouvelUtilisateur(Role.PARTICIPANT, TypeProfil.VISITEUR);
        Long ko = nouvelUtilisateur(Role.PARTICIPANT, TypeProfil.VISITEUR);
        String refOk = "MM-OK-" + SEQ.incrementAndGet();
        String refKo = "MM-KO-" + SEQ.incrementAndGet();
        agir(ok, "ROLE_PARTICIPANT");
        Long iOk = serviceReservation.reserver(ok, evt).id();
        servicePaiement.soumettrePreuve(iOk, ok, refOk, null);
        agir(ko, "ROLE_PARTICIPANT");
        Long iKo = serviceReservation.reserver(ko, evt).id();
        servicePaiement.soumettrePreuve(iKo, ko, refKo, null);

        String csv = "reference;montant;date\n" + refOk + ";5000;2026-12-01\n" + refKo + ";4000;2026-12-01\n";
        agir(admin(), "ROLE_ADMIN");
        RapportRapprochementResponse rapport = servicePaiement.importerReleveCsv(
                new MockMultipartFile("f", "releve.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8)));

        assertThat(rapport.confirmeesAutomatiquement()).isEqualTo(1);
        assertThat(paiements.findByInscriptionId(iOk).orElseThrow().getStatut()).isEqualTo(StatutPaiement.VALIDE);
        assertThat(inscriptions.findById(iOk).orElseThrow().getStatut()).isEqualTo(StatutInscription.CONFIRMEE);
        // Montant différent : reste à traiter manuellement
        assertThat(paiements.findByInscriptionId(iKo).orElseThrow().getStatut()).isEqualTo(StatutPaiement.EN_ATTENTE);
        assertThat(inscriptions.findById(iKo).orElseThrow().getStatut()).isEqualTo(StatutInscription.PREUVE_ENVOYEE);
    }

    @Test
    void changementDeFiliere_accepteEnL1_refuseEnL3_RG04() {
        Filiere gl = filieres.save(new Filiere("GL-" + SEQ.incrementAndGet()));
        Filiere ia = filieres.save(new Filiere("IA-" + SEQ.incrementAndGet()));
        int annee = Year.now().getValue();

        Long enL1 = nouvelUtilisateur(Role.PARTICIPANT, TypeProfil.ETUDIANT);
        etudiants.save(Etudiant.creer(enL1, "Doe", "Jane", gl, (short) annee, annee));
        agir(enL1, "ROLE_PARTICIPANT");
        serviceProfilEtudiant.changerFiliere(enL1, ia.getId());
        assertThat(etudiants.findById(enL1).orElseThrow().getFiliere().getId()).isEqualTo(ia.getId());

        Long enL3 = nouvelUtilisateur(Role.PARTICIPANT, TypeProfil.ETUDIANT);
        etudiants.save(Etudiant.creer(enL3, "Doe", "John", gl, (short) (annee - 2), annee));
        agir(enL3, "ROLE_PARTICIPANT");
        assertThatThrownBy(() -> serviceProfilEtudiant.changerFiliere(enL3, ia.getId()))
                .isInstanceOf(FiliereVerrouilleeException.class);
    }

    // ------------------------------------------------------------ utilitaires

    private static byte[] pngMinimal() {
        return java.util.Base64.getDecoder().decode(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==");
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
