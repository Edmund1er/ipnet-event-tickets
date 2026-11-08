package tg.ipnetinstitute.technology.features.notification.infrastructure;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import tg.ipnetinstitute.technology.features.notification.application.CanalNotification;
import tg.ipnetinstitute.technology.features.notification.domaine.ModeCanal;

/**
 * Implémentation e-mail utilisant le serveur SMTP de l'établissement (RG-01).
 */
@Component
public class CanalEmail implements CanalNotification {

    private static final Logger log = LoggerFactory.getLogger(CanalEmail.class);
    private final JavaMailSender mailSender;

    public CanalEmail(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public ModeCanal canal() {
        return ModeCanal.EMAIL;
    }

    @Override
    public void envoyer(String destinataire, String titre, String corps) {
        if (mailSender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom("billetterie@ipnetinstitute.tg");
                message.setTo(destinataire);
                message.setSubject(titre);
                message.setText(corps);
                mailSender.send(message);
                log.info("E-mail envoyé avec succès à {}", destinataire);
                return;
            } catch (Exception e) {
                log.warn("SMTP simulation / envoi d'email à {} : {} (titre: {})", destinataire, corps, titre);
            }
        }
        log.info("[SIMULATION EMAIL SMTP RG-01] Destinataire: {}, Objet: {}, Corps: {}", destinataire, titre, corps);
    }
}
