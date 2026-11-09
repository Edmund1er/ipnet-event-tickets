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
 * Canal e-mail via le SMTP configuré (RG-01 : SMTP de l'établissement, sans coût additionnel).
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

    public SmtpWrapper(org.springframework.beans.factory.ObjectProvider<JavaMailSender> mailSender,
                       @Value("${app.mail.expediteur:}") String expediteur,
                       @Value("${app.mail.nom-expediteur:IPNET Billetterie}") String nomExpediteur,
                       @Value("${spring.mail.host:}") String hote,
                       @Value("${spring.mail.port:587}") int port) {
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

    /** Le serveur SMTP est renseigné (SMTP_HOST et adresse d'expédition). */
    public boolean configure() {
        return !hote.isBlank() && expediteur != null && !expediteur.isBlank() && mailSender.getIfAvailable() != null;
    }

    public String hote() { return hote; }
    public int port() { return port; }
    public String expediteur() { return expediteur; }

    @Override
    public void envoyer(MessageSortant message) throws Exception {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (!configure() || sender == null) {
            throw new IllegalStateException("Serveur SMTP non configuré : renseignez SMTP_HOST, SMTP_USERNAME et SMTP_PASSWORD dans le fichier .env");
        }
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
}
