package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;

public class UtilisateurNonAutoriseException extends MetierException {
    public UtilisateurNonAutoriseException(Long utilisateurId) {
        super("Vérifiez votre adresse e-mail avant de réserver", HttpStatus.FORBIDDEN, "RG-07");
    }
}
