package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;

public class FiliereInvalideException extends MetierException {
    public FiliereInvalideException(Long filiereId) {
        super("Filière inexistante ou inactive : " + filiereId, HttpStatus.BAD_REQUEST, "RG-04");
    }
}
