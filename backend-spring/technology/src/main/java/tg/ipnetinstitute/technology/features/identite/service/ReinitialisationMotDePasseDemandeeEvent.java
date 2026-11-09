package tg.ipnetinstitute.technology.features.identite.service;

/**
 * Publié par identite lors d'une demande de réinitialisation (EF-06).
 * La feature notification l'écoute pour déposer l'e-mail dans l'outbox.
 */
public record ReinitialisationMotDePasseDemandeeEvent(
        Long utilisateurId,
        String email,
        String lien
) {}
