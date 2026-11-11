package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;

public class FiliereInvalideException extends MetierException {
    public FiliereInvalideException(Long filiereId) {
        super("Cette filière n'est pas disponible", HttpStatus.BAD_REQUEST, "RG-04");
    }
}
