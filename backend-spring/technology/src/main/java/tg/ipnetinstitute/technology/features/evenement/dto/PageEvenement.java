package tg.ipnetinstitute.technology.features.evenement.dto;

import java.util.List;

/**
 * Contenu de la page publique d'un événement : une liste de sections facultatives, dans l'ordre voulu par l'administrateur.
 * Aucune section n'est obligatoire : sans section, la page de base du modèle choisi se construit à partir de l'événement.
 */
public record PageEvenement(int version, List<Section> sections) {

    public static final List<String> TYPES = List.of("HERO", "A_PROPOS", "INTERVENANTS", "PROGRAMME", "LIEU", "TEXTE");

    public static PageEvenement vide() {
        return new PageEvenement(1, List.of());
    }

    /** Une section. Les champs inutiles pour son type restent vides. */
    public record Section(
            String id,
            String type,
            boolean actif,
            String titre,
            String sousTitre,
            String texte,
            /** Nom d'un fichier envoyé (image de fond ou d'illustration). */
            String image,
            String bouton,
            String adresse,
            String telephone,
            String email,
            List<Intervenant> intervenants,
            List<Creneau> creneaux
    ) {}

    public record Intervenant(String nom, String role, String photo) {}

    /** Un moment du programme : le jour (AAAA-MM-JJ), l'heure (HH:mm), un titre et des détails facultatifs. */
    public record Creneau(String jour, String debut, String fin, String titre, String description, String intervenant, String lieu) {}
}
