package tg.ipnetinstitute.technology.features.evenement.dto.request;

import jakarta.validation.constraints.Pattern;

/** Réglages d'apparence de la page d'un événement. Valeurs nulles : apparence par défaut. */
public record ApparenceEvenement(
        @Pattern(regexp = "^(SOBRE|ACADEMIQUE|CEREMONIE|SOIREE|SPORT|CULTURE|FESTIF|PLAGE|NATURE|URBAIN|GOSPEL|ELECTRO|FESTIVAL)$",
                message = "Ambiance inconnue") String ambiance,
        @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "Couleur au format #RRGGBB") String couleurPrincipale,
        @Pattern(regexp = "^(SOIREE|CONFERENCE|RENCONTRE|CEREMONIE|ATELIER|TOURNOI|SALON|RESEAUTAGE|LAGON|FORET|FORUM)$", message = "Modèle inconnu") String modele
) {
    public ApparenceEvenement(String ambiance, String couleurPrincipale) {
        this(ambiance, couleurPrincipale, null);
    }
}
