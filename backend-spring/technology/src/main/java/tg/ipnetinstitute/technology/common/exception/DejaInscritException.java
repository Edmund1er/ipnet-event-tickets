package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;

public class DejaInscritException extends MetierException {
    public DejaInscritException(Long utilisateurId, Long evenementId) {
        super("Vous êtes déjà inscrit à cet événement (RG-06)", HttpStatus.CONFLICT, "RG-06");
    }
}
