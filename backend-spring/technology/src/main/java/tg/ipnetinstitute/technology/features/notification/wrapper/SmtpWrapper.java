package tg.ipnetinstitute.technology.features.notification.wrapper;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import tg.ipnetinstitute.technology.features.notification.model.ModeCanal;

import java.nio.charset.StandardCharsets;

/**
 * Canal e-mail via Brevo. Deux modes, au choix de la configuration :
 * <ul>
 *   <li>API HTTPS Brevo (BREVO_API_KEY) : recommandé en hébergement, où les ports SMTP sont souvent bloqués ;</li>
 *   <li>relais SMTP Brevo (BREVO_SMTP_USERNAME / BREVO_SMTP_PASSWORD) : utilisé sinon, ou tout autre SMTP.</li>
 * </ul>
 * Aucune simulation : en cas d'échec l'exception remonte et l'outbox rejoue l'envoi.
 */
@Component
public class SmtpWrapper implements CanalNotification {

    private static final Logger log = LoggerFactory.getLogger(SmtpWrapper.class);

    private final org.springframework.beans.factory.ObjectProvider<JavaMailSender> mailSender;
    private final String expediteur;
    private final String hote;
    private final int port;
    private final String nomExpediteur;
    private static final String URL_API_DEFAUT = "https://api.brevo.com/v3/smtp/email";
    private final String cleApi;
    private final String urlApi;
    private final com.fasterxml.jackson.databind.ObjectMapper json = new com.fasterxml.jackson.databind.ObjectMapper();
    private final java.net.http.HttpClient http = java.net.http.HttpClient.newBuilder()
            .connectTimeout(java.time.Duration.ofSeconds(10)).build();

    public SmtpWrapper(org.springframework.beans.factory.ObjectProvider<JavaMailSender> mailSender,
                       @Value("${app.mail.expediteur:}") String expediteur,
                       @Value("${app.mail.nom-expediteur:IPNET Billetterie}") String nomExpediteur,
                       @Value("${spring.mail.host:}") String hote,
                       @Value("${spring.mail.port:587}") int port,
                       @Value("${app.mail.brevo.api-key:}") String cleApi,
                       @Value("${app.mail.brevo.api-url:}") String urlApi) {
        this.cleApi = cleApi == null ? "" : cleApi.trim();
        // Seule une URL pointant vers l'endpoint d'envoi est acceptée ; sinon (ex. « https://brevo.com »), l'URL officielle
        this.urlApi = urlApi != null && urlApi.trim().endsWith("/smtp/email") ? urlApi.trim() : URL_API_DEFAUT;
        this.mailSender = mailSender;
        this.hote = hote;
        this.port = port;
        this.expediteur = expediteur;
        this.nomExpediteur = nomExpediteur;
    }

    @Override
    public ModeCanal canal() {
        return ModeCanal.EMAIL;
    }

    private boolean modeApi() {
        return !cleApi.isBlank();
    }

    /** Messagerie prête : clé API Brevo, ou relais SMTP renseigné, et adresse d'expédition validée chez Brevo. */
    public boolean configure() {
        if (expediteur == null || expediteur.isBlank()) {
            return false;
        }
        return modeApi() || (!hote.isBlank() && mailSender.getIfAvailable() != null);
    }

    public String hote() { return modeApi() ? "api.brevo.com" : hote; }
    public int port() { return modeApi() ? 443 : port; }
    public String expediteur() { return expediteur; }

    @Override
    public void envoyer(MessageSortant message) throws Exception {
        if (!configure()) {
            throw new IllegalStateException("Messagerie non configurée : renseignez BREVO_API_KEY (ou BREVO_SMTP_USERNAME et "
                    + "BREVO_SMTP_PASSWORD) ainsi que MAIL_EXPEDITEUR, l'adresse d'expédition validée dans Brevo");
        }
        if (modeApi()) {
            envoyerParApi(message);
            return;
        }
        JavaMailSender sender = mailSender.getIfAvailable();
        MimeMessage mime = sender.createMimeMessage();
        boolean multipart = message.piecesJointes() != null && !message.piecesJointes().isEmpty();
        MimeMessageHelper helper = new MimeMessageHelper(mime, multipart, StandardCharsets.UTF_8.name());
        helper.setFrom(expediteur, nomExpediteur);
        helper.setTo(message.destinataire());
        helper.setSubject(message.sujet());
        helper.setText(message.corpsHtml(), true);

        if (multipart) {
            for (PieceJointe pj : message.piecesJointes()) {
                ByteArrayResource ressource = new ByteArrayResource(pj.contenu());
                if (pj.cid() != null) {
                    helper.addInline(pj.cid(), ressource, pj.typeMime());
                }
                helper.addAttachment(pj.nomFichier(), ressource, pj.typeMime());
            }
        }
        sender.send(mime);
        log.info("E-mail « {} » envoyé", message.sujet());
    }

    /** API transactionnelle Brevo : POST /v3/smtp/email (HTTPS, sans port SMTP). */
    private void envoyerParApi(MessageSortant message) throws Exception {
        var corps = json.createObjectNode();
        corps.putObject("sender").put("name", nomExpediteur).put("email", expediteur);
        corps.putArray("to").addObject().put("email", message.destinataire());
        corps.put("subject", message.sujet());
        corps.put("htmlContent", message.corpsHtml());
        if (message.piecesJointes() != null && !message.piecesJointes().isEmpty()) {
            var pieces = corps.putArray("attachment");
            for (PieceJointe pj : message.piecesJointes()) {
                pieces.addObject().put("name", pj.nomFichier())
                        .put("content", java.util.Base64.getEncoder().encodeToString(pj.contenu()));
            }
        }
        var requete = java.net.http.HttpRequest.newBuilder(java.net.URI.create(urlApi))
                .timeout(java.time.Duration.ofSeconds(20))
                .header("api-key", cleApi)
                .header("accept", "application/json")
                .header("content-type", "application/json")
                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(json.writeValueAsString(corps), StandardCharsets.UTF_8))
                .build();
        var reponse = http.send(requete, java.net.http.HttpResponse.BodyHandlers.ofString());
        if (reponse.statusCode() / 100 != 2) {
            throw new IllegalStateException("Brevo a refusé l'envoi (HTTP " + reponse.statusCode() + ") : " + reponse.body());
        }
        log.info("E-mail « {} » envoyé via l'API Brevo", message.sujet());
    }
}
