package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;

public class EmailDejaUtiliseException extends MetierException {
    public EmailDejaUtiliseException(String email) {
        super("Cette adresse e-mail est déjà associée à un compte : " + email, HttpStatus.CONFLICT, "RG-01");
    }
}
