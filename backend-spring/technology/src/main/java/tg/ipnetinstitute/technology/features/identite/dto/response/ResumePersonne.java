package tg.ipnetinstitute.technology.features.identite.dto.response;

/**
 * DTO résumé d'un participant (sur billet ou lors d'un scan). Le détail précise le profil (filière ou catégorie).
 */
public record ResumePersonne(
        String nom,
        String prenom,
        String detail
) {}
