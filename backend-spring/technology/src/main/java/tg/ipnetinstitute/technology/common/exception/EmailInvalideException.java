package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;

/** RG-01 : adresse refusée ; le message explique la règle non respectée. */
public class EmailInvalideException extends MetierException {
    public EmailInvalideException(String message) {
        super(message, HttpStatus.BAD_REQUEST, "RG-01");
    }
}
