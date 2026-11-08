package tg.ipnetinstitute.technology.features.identite.dto.response;

/**
 * DTO résumé d'un participant (sur billet ou lors d'un scan).
 */
public record ResumePersonne(
        String nom,
        String prenom,
        String adresse
) {}
