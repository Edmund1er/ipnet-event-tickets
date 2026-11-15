package tg.ipnetinstitute.technology.features.evenement.dto;

import java.util.List;

/**
 * Contenu de la page publique d'un événement : une liste de sections facultatives, dans l'ordre voulu par l'administrateur.
 * Aucune section n'est obligatoire : sans section, la page de base du modèle choisi se construit à partir de l'événement.
 */
public record PageEvenement(int version, Apparence apparence, List<Section> sections) {

    public static final List<String> TYPES = List.of("HERO", "A_PROPOS", "INTERVENANTS", "PROGRAMME", "LIEU", "TEXTE", "CARTES", "COLONNES");

    /** Compatibilité avec les pages enregistrées avant l'ajout des réglages d'apparence. */
    public PageEvenement(int version, List<Section> sections) {
        this(version, null, sections);
    }

    public static PageEvenement vide() {
        return new PageEvenement(1, null, List.of());
    }

    /** Couleurs indépendantes des zones globales et du voile de bannière. */
    public record Apparence(String couleurPrincipale, String couleurSecondaire, String couleurBloc, Integer opaciteBloc,
                            String couleurEntete, String couleurTexteEntete, String couleurFondPage,
                            String couleurPied, String couleurTextePied, String couleurTexte,
                            String couleurCarte, String couleurBouton) {
        public Apparence(String couleurPrincipale, String couleurSecondaire, String couleurBloc, Integer opaciteBloc) {
            this(couleurPrincipale, couleurSecondaire, couleurBloc, opaciteBloc, null, null, null, null, null, null, null, null);
        }
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
            List<Creneau> creneaux,
            List<BlocElement> elements,
            Integer colonnes,
            String couleurFond,
            String couleurTexte,
            String couleurAccent,
            String couleurCarte,
            String couleurBouton
    ) {
        public Section(String id, String type, boolean actif, String titre, String sousTitre, String texte, String image,
                       String bouton, String adresse, String telephone, String email,
                       List<Intervenant> intervenants, List<Creneau> creneaux) {
            this(id, type, actif, titre, sousTitre, texte, image, bouton, adresse, telephone, email,
                    intervenants, creneaux, List.of(), 3, null, null, null, null, null);
        }
    }

    public record BlocElement(String id, String titre, String texte, String image) {}

    public record Intervenant(String nom, String role, String photo) {}

    /** Un moment du programme : le jour (AAAA-MM-JJ), l'heure (HH:mm), un titre et des détails facultatifs. */
    public record Creneau(String jour, String debut, String fin, String titre, String description, String intervenant, String lieu) {}
}
