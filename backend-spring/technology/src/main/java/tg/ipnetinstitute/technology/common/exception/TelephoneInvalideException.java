package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;

/** RG-02 : numéro refusé ; le message explique la règle non respectée. */
public class TelephoneInvalideException extends MetierException {
    public TelephoneInvalideException(String message) {
        super(message, HttpStatus.BAD_REQUEST, "RG-02");
    }
}
