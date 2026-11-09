package tg.ipnetinstitute.technology.features.notification.service;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import tg.ipnetinstitute.technology.features.notification.utils.GabaritsEmail;
import tg.ipnetinstitute.technology.features.notification.wrapper.CanalNotification.MessageSortant;
import tg.ipnetinstitute.technology.features.notification.wrapper.SmtpWrapper;

import java.util.List;

/** État de la messagerie et envoi d'un e-mail de test (administration). */
@Service
public class ServiceDiagnosticSmtp {

    public record EtatSmtp(boolean configure, String hote, Integer port, String expediteur) {}

    private final SmtpWrapper smtp;

    public ServiceDiagnosticSmtp(SmtpWrapper smtp) {
        this.smtp = smtp;
    }

    public EtatSmtp etat() {
        return new EtatSmtp(smtp.configure(), smtp.hote().isBlank() ? null : smtp.hote(), smtp.port(),
                smtp.expediteur() == null || smtp.expediteur().isBlank() ? null : smtp.expediteur());
    }

    public boolean configure() {
        return smtp.configure();
    }

    /** Envoi direct (hors outbox) pour vérifier immédiatement la configuration. */
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public void envoyerTest(String destinataire) {
        try {
            smtp.envoyer(new MessageSortant(destinataire, "Test de la messagerie IPNET Billetterie",
                    GabaritsEmail.test(), List.of()));
        } catch (Exception e) {
            String cause = e.getCause() != null ? e.getCause().getMessage() : e.getMessage();
            throw new IllegalStateException("Échec de l'envoi : " + (cause != null ? cause : e.getClass().getSimpleName()));
        }
    }
}
