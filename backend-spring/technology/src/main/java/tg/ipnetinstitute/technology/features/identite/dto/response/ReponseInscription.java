package tg.ipnetinstitute.technology.features.identite.dto.response;

/**
 * Réponse à une demande d'inscription : aucun compte n'existe encore, aucune session n'est ouverte.
 * Le compte n'est créé qu'après validation du code envoyé à {@code email}.
 */
public record ReponseInscription(
        String email,
        int codeValideMinutes,
        String message
) {}
