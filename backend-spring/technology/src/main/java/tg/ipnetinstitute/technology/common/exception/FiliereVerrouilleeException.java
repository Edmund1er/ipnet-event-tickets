package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;

public class FiliereVerrouilleeException extends MetierException {
    public FiliereVerrouilleeException(Long utilisateurId) {
        super("Votre filière est verrouillée et ne peut plus être modifiée", HttpStatus.BAD_REQUEST, "RG-04");
    }
}
