package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Ressource demandée inexistante (ou non visible pour l'appelant) : HTTP 404.
 */
public class RessourceIntrouvableException extends MetierException {
    public RessourceIntrouvableException(String typeRessource, Object identifiant) {
        super(typeRessource + " introuvable", HttpStatus.NOT_FOUND, "RESSOURCE_INTROUVABLE");
    }
}
