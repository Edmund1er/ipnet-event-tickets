package tg.ipnetinstitute.technology.features.notification.utils;

import org.springframework.web.util.HtmlUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Gabarits HTML des e-mails (charte IPNET : bleu, rouge, blanc).
 * Fonctions pures : toutes les valeurs dynamiques sont échappées.
 */
public final class GabaritsEmail {

    private static final String BLEU = "#1E5BA3";
    private static final String BLEU_FONCE = "#133E70";
    private static final String ROUGE = "#B0322A";
    private static final DateTimeFormatter FORMAT_DATE =
            DateTimeFormatter.ofPattern("EEEE d MMMM yyyy 'à' HH'h'mm", Locale.FRENCH);

    private GabaritsEmail() {}

    public static String date(LocalDateTime d) {
        return d == null ? "" : FORMAT_DATE.format(d);
    }

    private static String e(String s) {
        return s == null ? "" : HtmlUtils.htmlEscape(s);
    }

    private static String cadre(String titre, String contenu) {
        return """
                <!doctype html><html lang="fr"><body style="margin:0;padding:0;background:#F4F6FA;font-family:Arial,Helvetica,sans-serif;color:#0F1E33;">
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background:#F4F6FA;padding:24px 0;">
                <tr><td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%%;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;">
                <tr><td style="background:%s;padding:20px 24px;">
                  <span style="color:#FFFFFF;font-size:20px;font-weight:bold;letter-spacing:.5px;">IPNET</span>
                  <span style="color:#FFFFFF;font-size:13px;opacity:.85;"> Institute of Technology · Billetterie</span>
                </td></tr>
                <tr><td style="height:4px;background:%s;"></td></tr>
                <tr><td style="padding:28px 24px;">
                  <h1 style="margin:0 0 16px;font-size:20px;color:%s;">%s</h1>
                  %s
                </td></tr>
                <tr><td style="padding:16px 24px;background:#F8FAFC;border-top:1px solid #E2E8F0;font-size:12px;color:#64748B;">
                  Message automatique de la billetterie IPNET Institute of Technology. Merci de ne pas y répondre.
                </td></tr>
                </table></td></tr></table></body></html>
                """.formatted(BLEU, ROUGE, BLEU_FONCE, e(titre), contenu);
    }

    private static String p(String html) {
        return "<p style=\"margin:0 0 12px;font-size:15px;line-height:22px;\">" + html + "</p>";
    }

    private static String bouton(String lien, String libelle) {
        return "<p style=\"margin:20px 0;\"><a href=\"" + e(lien) + "\" style=\"display:inline-block;background:" + BLEU
                + ";color:#FFFFFF;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:4px;\">"
                + e(libelle) + "</a></p>";
    }

    public static String otp(String code) {
        return cadre("Votre code de vérification",
                p("Voici votre code de vérification à saisir sur la plateforme :")
                        + "<p style=\"margin:16px 0;font-size:32px;font-weight:bold;letter-spacing:8px;color:" + BLEU + ";\">"
                        + e(code) + "</p>"
                        + p("Ce code est valable <strong>5 minutes</strong> et ne peut être utilisé qu'une seule fois.")
                        + p("Si vous n'êtes pas à l'origine de cette demande, ignorez ce message."));
    }

    public static String billet(String titre, LocalDateTime dateDebut, String lieu, String nom, String prenom, String urlFront) {
        return cadre("Votre billet est prêt",
                p("Bonjour " + e(prenom) + " " + e(nom) + ",")
                        + p("Votre paiement a été confirmé. Voici votre billet pour <strong>" + e(titre) + "</strong>.")
                        + "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:16px 0;border:1px dashed " + BLEU
                        + ";border-radius:8px;width:100%;\"><tr><td style=\"padding:16px;\">"
                        + "<p style=\"margin:0 0 6px;font-size:13px;color:#64748B;\">ÉVÉNEMENT</p>"
                        + "<p style=\"margin:0 0 12px;font-size:17px;font-weight:bold;\">" + e(titre) + "</p>"
                        + "<p style=\"margin:0 0 4px;font-size:14px;\">📅 " + e(date(dateDebut)) + "</p>"
                        + "<p style=\"margin:0 0 4px;font-size:14px;\">📍 " + e(lieu) + "</p>"
                        + "<p style=\"margin:0 0 12px;font-size:14px;\">👤 " + e(prenom) + " " + e(nom) + "</p>"
                        + "<p style=\"margin:0;text-align:center;\"><img src=\"cid:qrcode\" width=\"240\" height=\"240\" alt=\"QR code du billet\"/></p>"
                        + "</td></tr></table>"
                        + p("Présentez ce QR code à l'entrée (écran ou impression). Il est aussi joint à cet e-mail et reste disponible dans votre espace.")
                        + bouton(urlFront + "/billets", "Voir mes billets"));
    }

    public static String preuveRejetee(String titreEvenement, String motif, String urlFront) {
        return cadre("Paiement non validé",
                p("Votre référence de paiement pour <strong>" + e(titreEvenement) + "</strong> n'a pas pu être validée.")
                        + p("<strong>Motif :</strong> " + e(motif))
                        + p("Vous pouvez soumettre une nouvelle référence depuis votre espace, avant l'expiration de votre réservation.")
                        + bouton(urlFront + "/reservations", "Mes réservations"));
    }

    public static String evenementAnnule(String titre, LocalDateTime dateDebut, String motif, boolean aRembourser, String contactRemboursement) {
        String remboursement = aRembourser
                ? p("<strong>Votre paiement sera remboursé.</strong> Le remboursement est traité manuellement par l'administration "
                    + "(hors plateforme). " + (contactRemboursement == null || contactRemboursement.isBlank() ? ""
                    : "Pour toute question : " + e(contactRemboursement) + "."))
                : "";
        return cadre("Événement annulé",
                p("Nous sommes au regret de vous informer que l'événement <strong>" + e(titre) + "</strong>"
                        + (dateDebut != null ? " prévu le " + e(date(dateDebut)) : "") + " est annulé.")
                        + (motif == null || motif.isBlank() ? "" : p("<strong>Motif :</strong> " + e(motif)))
                        + p("Votre réservation a été annulée et votre billet, s'il avait été émis, n'est plus valable.")
                        + remboursement);
    }

    public static String reinitialisation(String lien) {
        return cadre("Réinitialisation du mot de passe",
                p("Une demande de réinitialisation de votre mot de passe a été effectuée.")
                        + bouton(lien, "Choisir un nouveau mot de passe")
                        + p("Ce lien est valable <strong>30 minutes</strong> et ne peut servir qu'une fois.")
                        + p("Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe reste inchangé."));
    }

    public static String test() {
        return cadre("Messagerie opérationnelle",
                p("Cet e-mail confirme que la plateforme peut envoyer des messages : codes de vérification, billets et notifications."));
    }

    public static String alerteEchec(String modele, String destinataire, String erreur, String urlFront) {
        return cadre("Alerte : notification non distribuée",
                p("Une notification n'a pas pu être envoyée après plusieurs tentatives.")
                        + p("<strong>Type :</strong> " + e(modele) + "<br/><strong>Destinataire :</strong> " + e(destinataire))
                        + p("<strong>Dernière erreur :</strong> " + e(erreur))
                        + bouton(urlFront + "/admin/notifications", "Voir les notifications"));
    }
}
