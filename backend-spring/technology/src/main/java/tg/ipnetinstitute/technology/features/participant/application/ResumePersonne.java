package tg.ipnetinstitute.technology.features.participant.application;

/**
 * DTO résumé d'un participant (sur billet ou lors d'un scan).
 */
public record ResumePersonne(
        String nom,
        String prenom,
        String adresse
) {}
