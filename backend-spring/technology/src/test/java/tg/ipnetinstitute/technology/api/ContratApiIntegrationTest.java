package tg.ipnetinstitute.technology.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tg.ipnetinstitute.technology.features.identite.model.CategorieVisiteur;
import tg.ipnetinstitute.technology.features.identite.model.Filiere;
import tg.ipnetinstitute.technology.features.identite.repository.CategorieVisiteurRepository;
import tg.ipnetinstitute.technology.features.identite.repository.FiliereRepository;
import tg.ipnetinstitute.technology.features.notification.model.ModeleNotification;
import tg.ipnetinstitute.technology.features.notification.model.StatutOutbox;
import tg.ipnetinstitute.technology.features.notification.repository.OutboxNotificationRepository;
import tg.ipnetinstitute.technology.features.notification.service.DispatcheurOutbox;

import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.PhoneNumberUtil.PhoneNumberType;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Vérifie le contrat d'API attendu par le front, sans simulation métier :
 * premier événement, OTP réel (code lu dans l'outbox), réservation, référence, validation,
 * billet + e-mail avec QR code, scan, exports CSV/PDF, filtres, erreurs normalisées.
 * Seul le serveur SMTP est remplacé par un double de test.
 */
@SpringBootTest
@AutoConfigureMockMvc
class ContratApiIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired FiliereRepository filieres;
    @Autowired CategorieVisiteurRepository categories;
    @Autowired OutboxNotificationRepository outbox;
    @Autowired DispatcheurOutbox dispatcheur;
    @Autowired ObjectMapper objectMapper;

    @MockitoBean JavaMailSender mailSender;

    private final List<MimeMessage> envoyes = new ArrayList<>();

    @BeforeEach
    void smtp() {
        when(mailSender.createMimeMessage()).thenAnswer(i -> new MimeMessage(Session.getInstance(new Properties())));
        doAnswer(i -> { envoyes.add(i.getArgument(0)); return null; }).when(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void parcoursCompletDuContratApi() throws Exception {
        filieres.save(new Filiere("Génie Logiciel"));
        Long categorieId = categories.save(new CategorieVisiteur("PARENT", "Parent")).getId();

        // Numéros de test tirés des métadonnées libphonenumber (aucun numéro codé en dur)
        String mobileAdmin = numeroTogo(PhoneNumberType.MOBILE, 0);
        String mobileParticipant = numeroTogo(PhoneNumberType.MOBILE, 1);
        String mobileAgent = numeroTogo(PhoneNumberType.MOBILE, 2);
        String mobileMoney = numeroTogo(PhoneNumberType.MOBILE, 3);
        String fixe = numeroTogo(PhoneNumberType.FIXED_LINE, 0);

        // Référentiels publics (formulaire d'inscription) et politique de numérotation
        mvc.perform(get("/api/referentiels/filieres"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].libelle").value("Génie Logiciel"));
        mvc.perform(get("/api/referentiels/categories-visiteurs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("PARENT"));
        mvc.perform(get("/api/referentiels/telephone"))
                .andExpect(jsonPath("$.regionParDefaut").value("TG"))
                .andExpect(jsonPath("$.indicatifParDefaut").value(228));

        // 401 normalisé sans jeton
        mvc.perform(get("/api/profil/moi"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("NON_AUTHENTIFIE"));

        // ---- Installation : aucun administrateur, code d'installation exigé ----
        mvc.perform(get("/api/installation")).andExpect(jsonPath("$.installationRequise").value(true));
        String codeInstallation = Files.readString(Path.of("code-installation.txt")).replaceAll("(?s).*: ([A-Z0-9-]{14}).*", "$1");
        String installation = """
                {"code":"%s","email":"admin@test.tg","telephone":"%s","motDePasse":"MotDePasseAdmin2026"}""";
        mvc.perform(post("/api/installation").contentType(MediaType.APPLICATION_JSON)
                        .content(installation.formatted("AAAA-BBBB-CCCC", mobileAdmin)))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/installation").contentType(MediaType.APPLICATION_JSON)
                        .content(installation.formatted(codeInstallation, "+22812")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("RG-02"));
        String sessionAdmin = mvc.perform(post("/api/installation").contentType(MediaType.APPLICATION_JSON)
                        .content(installation.formatted(codeInstallation, mobileAdmin)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.emailVerifie").value(false))
                .andReturn().getResponse().getContentAsString();
        assertThat(Files.exists(Path.of("code-installation.txt"))).isFalse();
        mvc.perform(get("/api/installation")).andExpect(jsonPath("$.installationRequise").value(false));
        String adminNonVerifie = "Bearer " + JsonPath.read(sessionAdmin, "$.accessToken");

        // E-mail non vérifié : aucun droit d'administration
        mvc.perform(get("/api/admin/tableau-de-bord").header("Authorization", adminNonVerifie))
                .andExpect(status().isForbidden());
        String admin = verifierEmail(adminNonVerifie, "admin@test.tg");

        // Premier événement créé et publié après l'installation : 05/12/2026 18h30, 500 FCFA, avec image
        String liste = mvc.perform(get("/api/evenements"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.elements[0].dateDebut").value("2026-12-05T18:30:00"))
                .andExpect(jsonPath("$.elements[0].prix").value(500))
                .andExpect(jsonPath("$.elements[0].devise").value("XOF"))
                .andExpect(jsonPath("$.elements[0].statut").value("PUBLIE"))
                .andExpect(jsonPath("$.elements[0].aImage").value(true))
                .andExpect(jsonPath("$.elements[0].placesRestantes").value(300))
                .andReturn().getResponse().getContentAsString();
        Integer premierId = JsonPath.read(liste, "$.elements[0].id");
        mvc.perform(get("/api/evenements/" + premierId + "/image"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/jpeg"));

        // Création + publication d'un second événement
        String evt = mvc.perform(post("/api/admin/evenements").header("Authorization", admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"titre":"Gala","description":"Soirée","dateDebut":"%s","lieu":"Campus",
                                 "prix":5000,"devise":"XOF","capacite":100}
                                """.formatted(LocalDateTime.now().plusDays(10).withNano(0))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.statut").value("BROUILLON"))
                .andReturn().getResponse().getContentAsString();
        Integer evenementId = JsonPath.read(evt, "$.id");

        // Un brouillon n'est pas visible publiquement
        mvc.perform(get("/api/evenements/" + evenementId)).andExpect(status().isNotFound());

        // Image d'événement : contenu vérifié (un faux fichier est refusé)
        mvc.perform(multipart("/api/admin/evenements/" + evenementId + "/image")
                        .file(new MockMultipartFile("fichier", "x.png", "image/png", "pas une image".getBytes()))
                        .header("Authorization", admin))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/api/admin/evenements/" + evenementId + "/publication").header("Authorization", admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("PUBLIE"));

        // EF-13 : filtres
        mvc.perform(get("/api/evenements"))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.elements[0].titre").value("Gala"));
        mvc.perform(get("/api/evenements").param("titre", "gAl"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.elements[0].titre").value("Gala"));
        mvc.perform(get("/api/evenements").param("prixMax", "1000"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.elements[0].id").value(premierId));
        mvc.perform(get("/api/evenements").param("dateMin", "2026-12-05").param("dateMax", "2026-12-05"))
                .andExpect(jsonPath("$.totalElements").value(1));

        mvc.perform(get("/api/admin/evenements").header("Authorization", admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.elements", hasSize(2)));

        // Inscription d'un visiteur : numéro trop court refusé ; saisie nationale acceptée (région TG)
        mvc.perform(post("/api/auth/inscription").contentType(MediaType.APPLICATION_JSON)
                        .content(inscriptionVisiteur(categorieId, "+2281234")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("RG-02"));
        // Étape 1 : la demande est mise en attente, AUCUN compte n'est créé et aucune session n'est ouverte
        mvc.perform(post("/api/auth/inscription")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(inscriptionVisiteur(categorieId, national(mobileParticipant))))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.email").value("parent@test.tg"))
                .andExpect(jsonPath("$.session").doesNotExist())
                .andExpect(header().doesNotExist("Set-Cookie"));
        mvc.perform(post("/api/auth/connexion").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"parent@test.tg\",\"motDePasse\":\"MotDePasseParent1\"}"))
                .andExpect(status().isUnauthorized());

        // Étape 2 : un mauvais code est refusé ; le bon code crée le compte (e-mail déjà vérifié) et ouvre la session
        mvc.perform(post("/api/auth/inscription/verification").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"parent@test.tg\",\"code\":\"000000\"}"))
                .andExpect(status().isBadRequest());
        var notif = outbox.findAll().stream()
                .filter(n -> n.getModele() == ModeleNotification.OTP && n.getDestinataire().equals("parent@test.tg"))
                .reduce((x, y) -> y).orElseThrow();
        String codeInscription = objectMapper.readTree(notif.getCharge()).path("code").asText();
        assertThat(codeInscription).matches("\\d{6}");
        dispatcheur.traiterEnAttente();
        assertThat(outbox.findById(notif.getId()).orElseThrow().getStatut()).isEqualTo(StatutOutbox.ENVOYEE);
        MockHttpServletResponse inscription = mvc.perform(post("/api/auth/inscription/verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"parent@test.tg\",\"code\":\"" + codeInscription + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.emailVerifie").value(true))
                .andExpect(header().string("Set-Cookie", containsString("refreshToken=")))
                .andReturn().getResponse();
        String participant = "Bearer " + JsonPath.read(inscription.getContentAsString(), "$.accessToken");
        Cookie refresh = inscription.getCookie("refreshToken");
        // Un code ne sert qu'une fois : la demande en attente a disparu
        mvc.perform(post("/api/auth/inscription/verification").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"parent@test.tg\",\"code\":\"" + codeInscription + "\"}"))
                .andExpect(status().isBadRequest());
        assertThat(envoyes).anySatisfy(m -> assertThat(sujet(m)).contains("code de vérification"));

        // Profil courant
        mvc.perform(get("/api/profil/moi").header("Authorization", participant))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom").value("Kossi"))
                .andExpect(jsonPath("$.emailVerifie").value(true))
                .andExpect(jsonPath("$.visiteur.categorieCode").value("PARENT"))
                .andExpect(jsonPath("$.motDePasseHash").doesNotExist());

        // EF-07 : aucun numéro de paiement par défaut → réservations fermées
        mvc.perform(get("/api/parametres/paiement").header("Authorization", participant))
                .andExpect(jsonPath("$.configure").value(false))
                .andExpect(jsonPath("$.numeroMobileMoney").doesNotExist());
        mvc.perform(post("/api/reservations").header("Authorization", participant)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"evenementId\":" + evenementId + "}"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("PAIEMENT_NON_CONFIGURE"));

        // L'administrateur saisit le numéro : une ligne fixe est refusée, une ligne mobile acceptée
        String paiement = """
                {"numero":"%s","titulaire":"IPNET Institute of Technology"}""";
        mvc.perform(put("/api/admin/parametres/paiement").header("Authorization", admin)
                        .contentType(MediaType.APPLICATION_JSON).content(paiement.formatted(fixe)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("RG-02"));
        mvc.perform(put("/api/admin/parametres/paiement").header("Authorization", admin)
                        .contentType(MediaType.APPLICATION_JSON).content(paiement.formatted(mobileMoney)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.configure").value(true));
        mvc.perform(get("/api/parametres/paiement").header("Authorization", participant))
                .andExpect(jsonPath("$.numeroMobileMoney").value(mobileMoney))
                .andExpect(jsonPath("$.numeroAffiche").value(org.hamcrest.Matchers.startsWith("+228 ")));

        // Agent de scan : numéro validé, e-mail à confirmer par l'agent lui-même
        mvc.perform(post("/api/admin/scanners").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"agent@test.tg\",\"telephone\":\"" + mobileAgent + "\",\"motDePasse\":\"MotDePasseAgent2026\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.emailVerifie").value(false));

        // Réservation : montant figé (RG-17)
        String resa = mvc.perform(post("/api/reservations").header("Authorization", participant)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"evenementId\":" + evenementId + "}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.statut").value("EN_ATTENTE_PAIEMENT"))
                .andExpect(jsonPath("$.montant").value(5000))
                .andExpect(jsonPath("$.evenement.titre").value("Gala"))
                .andReturn().getResponse().getContentAsString();
        Integer reservationId = JsonPath.read(resa, "$.id");

        // Un participant n'accède pas à l'administration
        mvc.perform(get("/api/admin/paiements").header("Authorization", participant))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCES_REFUSE"));

        // Référence de paiement
        mvc.perform(multipart("/api/reservations/" + reservationId + "/preuve")
                        .param("referenceOperateur", "tx 123 abc")
                        .header("Authorization", participant))
                .andExpect(status().isOk());
        // RG-14 : pas de seconde soumission
        mvc.perform(multipart("/api/reservations/" + reservationId + "/preuve")
                        .param("referenceOperateur", "AUTRE")
                        .header("Authorization", participant))
                .andExpect(status().isConflict());

        String file = mvc.perform(get("/api/admin/paiements").header("Authorization", admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.elements[0].referenceOperateur").value("TX123ABC"))
                .andExpect(jsonPath("$.elements[0].participantNom").value("Kossi"))
                .andExpect(jsonPath("$.elements[0].evenementTitre").value("Gala"))
                .andExpect(jsonPath("$.elements[0].cheminPreuve").doesNotExist())
                .andReturn().getResponse().getContentAsString();
        Integer paiementId = JsonPath.read(file, "$.elements[0].id");

        // EF-12 : modification encore possible (aucune réservation confirmée)
        String modification = """
                {"titre":"Gala IPNET","description":"Soirée","dateDebut":"%s","lieu":"Campus",
                 "prix":5000,"devise":"XOF","capacite":100}
                """.formatted(LocalDateTime.now().plusDays(11).withNano(0));
        mvc.perform(put("/api/admin/evenements/" + evenementId).header("Authorization", admin)
                        .contentType(MediaType.APPLICATION_JSON).content(modification))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titre").value("Gala IPNET"));

        mvc.perform(post("/api/admin/paiements/" + paiementId + "/validation").header("Authorization", admin))
                .andExpect(status().isOk());

        // EF-12 : plus modifiable une fois une réservation confirmée
        mvc.perform(put("/api/admin/evenements/" + evenementId).header("Authorization", admin)
                        .contentType(MediaType.APPLICATION_JSON).content(modification))
                .andExpect(status().isConflict());

        // Billet émis après commit, avec les infos d'affichage (EF-32) et sans nonce
        String billets = mvc.perform(get("/api/billets/moi").header("Authorization", participant))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].evenementTitre").value("Gala IPNET"))
                .andExpect(jsonPath("$[0].porteurNom").value("Kossi"))
                .andExpect(jsonPath("$[0].nonce").doesNotExist())
                .andReturn().getResponse().getContentAsString();
        String billetId = JsonPath.read(billets, "$[0].id");
        mvc.perform(get("/api/billets/" + billetId + "/qr").header("Authorization", participant))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG));

        // E-mail du billet avec QR code en pièce jointe (EF-31)
        dispatcheur.traiterEnAttente();
        MimeMessage mailBillet = envoyes.stream()
                .filter(m -> sujet(m).startsWith("Votre billet")).findFirst().orElseThrow();
        assertThat(mailBillet.getAllRecipients()[0].toString()).isEqualTo("parent@test.tg");
        mailBillet.saveChanges(); // finalise les en-têtes comme le ferait le transport SMTP
        assertThat(mailBillet.getContentType()).contains("multipart");
        var parties = (jakarta.mail.internet.MimeMultipart) mailBillet.getContent();
        java.io.ByteArrayOutputStream brut = new java.io.ByteArrayOutputStream();
        mailBillet.writeTo(brut);
        assertThat(brut.toString()).contains("billet-ipnet.png").contains("image/png");
        assertThat(parties.getCount()).isGreaterThanOrEqualTo(2);

        // Réservation confirmée : annulation par le participant refusée (EF-25)
        mvc.perform(delete("/api/reservations/" + reservationId).header("Authorization", participant))
                .andExpect(status().isConflict());

        // Scan d'un jeton falsifié : discriminant explicite
        mvc.perform(post("/api/scan").header("Authorization", admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"jeton\":\"pas-un-jeton\",\"evenementId\":" + evenementId + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultat").value("INVALIDE"));

        mvc.perform(get("/api/scan/evenements/" + evenementId + "/statistiques").header("Authorization", admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombreBilletsConfirmes").value(1))
                .andExpect(jsonPath("$.nombreRestants").value(1));

        // Scan réel : le jeton est lu dans l'image QR renvoyée par l'API
        byte[] qrPng = mvc.perform(get("/api/billets/" + billetId + "/qr").header("Authorization", participant))
                .andReturn().getResponse().getContentAsByteArray();
        var image = javax.imageio.ImageIO.read(new java.io.ByteArrayInputStream(qrPng));
        String jetonQr = new com.google.zxing.MultiFormatReader().decode(new com.google.zxing.BinaryBitmap(
                new com.google.zxing.common.HybridBinarizer(
                        new com.google.zxing.client.j2se.BufferedImageLuminanceSource(image)))).getText();
        mvc.perform(post("/api/scan").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"jeton\":\"" + jetonQr + "\",\"evenementId\":" + premierId + "}"))
                .andExpect(jsonPath("$.resultat").value("MAUVAIS_EVENEMENT"));
        mvc.perform(post("/api/scan").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"jeton\":\"" + jetonQr + "\",\"evenementId\":" + evenementId + "}"))
                .andExpect(jsonPath("$.resultat").value("ACCEPTE"))
                .andExpect(jsonPath("$.nom").value("Kossi"))
                .andExpect(jsonPath("$.detail").value(containsString("Parent")));
        mvc.perform(post("/api/scan").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"jeton\":\"" + jetonQr + "\",\"evenementId\":" + evenementId + "}"))
                .andExpect(jsonPath("$.resultat").value("DEJA_UTILISE"))
                .andExpect(jsonPath("$.premierScan").isNotEmpty());
        mvc.perform(get("/api/scan/evenements/" + evenementId + "/statistiques").header("Authorization", admin))
                .andExpect(jsonPath("$.nombreEntrees").value(1))
                .andExpect(jsonPath("$.nombreRestants").value(0))
                .andExpect(jsonPath("$.personnes[0].prenom").value("Ama"));

        // Exports réels (EF-45)
        byte[] pdf = mvc.perform(get("/api/admin/evenements/" + evenementId + "/export").param("format", "PDF")
                        .header("Authorization", admin))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andReturn().getResponse().getContentAsByteArray();
        assertThat(new String(pdf, 0, 5)).isEqualTo("%PDF-");
        mvc.perform(get("/api/admin/evenements/" + evenementId + "/export").param("format", "CSV")
                        .header("Authorization", admin))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Nom;Prénom;Profil")));

        // Tableau de bord administrateur
        mvc.perform(get("/api/admin/tableau-de-bord").header("Authorization", admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.evenementsPublies").value(2))
                .andExpect(jsonPath("$.reservationsConfirmees").value(1))
                .andExpect(jsonPath("$.billetsValides").value(1));

        // Participants (EF-50) et audit (EF-51) en DTO
        mvc.perform(get("/api/admin/evenements/" + evenementId + "/participants").header("Authorization", admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].statut").value("CONFIRMEE"))
                .andExpect(jsonPath("$[0].email").value("parent@test.tg"));
        mvc.perform(get("/api/admin/audit").header("Authorization", admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.elements").isArray());
        mvc.perform(get("/api/admin/notifications").header("Authorization", admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.elements[0].charge").doesNotExist());

        // Annulation de l'événement : cascade RG-19 + e-mail
        mvc.perform(post("/api/admin/evenements/" + evenementId + "/annulation").header("Authorization", admin)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"motif\":\"Intempéries\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("ANNULE"));
        mvc.perform(get("/api/billets/moi").header("Authorization", participant))
                .andExpect(jsonPath("$[0].invalide").value(true));
        mvc.perform(get("/api/admin/paiements").param("statut", "A_REMBOURSER").header("Authorization", admin))
                .andExpect(jsonPath("$.elements", hasSize(1)));
        mvc.perform(post("/api/admin/paiements/" + paiementId + "/remboursement").header("Authorization", admin))
                .andExpect(status().isOk());
        dispatcheur.traiterEnAttente();
        assertThat(envoyes).anySatisfy(m -> assertThat(sujet(m)).startsWith("Annulation"));

        // Rafraîchissement par cookie ; un jeton d'accès n'est pas accepté comme refresh
        mvc.perform(post("/api/auth/rafraichir").cookie(refresh))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());
        mvc.perform(post("/api/auth/rafraichir").cookie(new Cookie("refreshToken", participant.substring(7))))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/rafraichir"))
                .andExpect(status().isNoContent());

        // Mot de passe oublié : e-mail avec lien, puis réinitialisation effective
        mvc.perform(post("/api/auth/mot-de-passe/oubli").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"inconnu@test.tg\"}"))
                .andExpect(status().isOk());
        mvc.perform(post("/api/auth/mot-de-passe/oubli").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"parent@test.tg\"}"))
                .andExpect(status().isOk());
        var notifReset = outbox.findAll().stream()
                .filter(n -> n.getModele() == ModeleNotification.RESET_MOT_DE_PASSE).findFirst().orElseThrow();
        String lien = objectMapper.readTree(notifReset.getCharge()).path("lien").asText();
        String jeton = java.net.URLDecoder.decode(lien.substring(lien.indexOf("jeton=") + 6), java.nio.charset.StandardCharsets.UTF_8);
        mvc.perform(post("/api/auth/mot-de-passe/reinitialisation").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"jeton\":\"" + jeton + "\",\"nouveauMotDePasse\":\"NouveauMotDePasse2026\"}"))
                .andExpect(status().isOk());
        mvc.perform(post("/api/auth/mot-de-passe/reinitialisation").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"jeton\":\"" + jeton + "\",\"nouveauMotDePasse\":\"EncoreUnAutre2026\"}"))
                .andExpect(status().isBadRequest());
        connecter("parent@test.tg", "NouveauMotDePasse2026", "PARTICIPANT");

        // Événement introuvable : 404 et non 500
        mvc.perform(get("/api/admin/evenements/99999").header("Authorization", admin))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("RESSOURCE_INTROUVABLE"));
    }

    /** Lit le code de vérification déposé dans l'outbox, l'envoie, le confirme et renvoie le nouveau jeton. */
    private String verifierEmail(String jeton, String email) throws Exception {
        var notif = outbox.findAll().stream()
                .filter(n -> n.getModele() == ModeleNotification.OTP && n.getDestinataire().equals(email))
                .reduce((a, b) -> b).orElseThrow();
        String code = objectMapper.readTree(notif.getCharge()).path("code").asText();
        assertThat(code).matches("\\d{6}");
        dispatcheur.traiterEnAttente();
        assertThat(outbox.findById(notif.getId()).orElseThrow().getStatut()).isEqualTo(StatutOutbox.ENVOYEE);
        String r = mvc.perform(post("/api/auth/otp/verification").header("Authorization", jeton)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"code\":\"" + code + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailVerifie").value(true))
                .andReturn().getResponse().getContentAsString();
        return "Bearer " + JsonPath.read(r, "$.accessToken");
    }

    /** n-ième numéro togolais valide du type demandé, construit à partir de l'exemple des métadonnées. */
    private static String numeroTogo(PhoneNumberType type, int rang) {
        var util = PhoneNumberUtil.getInstance();
        long depart = util.getExampleNumberForType("TG", type).getNationalNumber();
        int trouves = -1;
        for (long candidat = depart; candidat < depart + 1000; candidat++) {
            var n = new com.google.i18n.phonenumbers.Phonenumber.PhoneNumber().setCountryCode(228).setNationalNumber(candidat);
            if (util.isValidNumber(n) && util.getNumberType(n) == type && ++trouves == rang) {
                return util.format(n, PhoneNumberUtil.PhoneNumberFormat.E164);
            }
        }
        throw new IllegalStateException("Aucun numéro " + type);
    }

    /** "+22890112345" → "90 11 23 45" (saisie nationale sans indicatif) */
    private static String national(String e164) {
        return e164.substring(4, 6) + " " + e164.substring(6, 8) + " " + e164.substring(8, 10) + " " + e164.substring(10);
    }

    private static String inscriptionVisiteur(Long categorieId, String telephone) {
        return """
                {"email":"Parent@Test.tg","telephone":"%s","motDePasse":"MotDePasseParent1",
                 "typeProfil":"VISITEUR","categorieId":%d,"nom":"Kossi","prenom":"Ama"}
                """.formatted(telephone, categorieId);
    }

    private static String sujet(MimeMessage m) {
        try {
            return m.getSubject();
        } catch (Exception e) {
            return "";
        }
    }

    private String connecter(String email, String motDePasse, String roleAttendu) throws Exception {
        String reponse = mvc.perform(post("/api/auth/connexion").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"motDePasse\":\"%s\"}".formatted(email, motDePasse)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value(roleAttendu))
                .andReturn().getResponse().getContentAsString();
        return "Bearer " + JsonPath.read(reponse, "$.accessToken");
    }
}
