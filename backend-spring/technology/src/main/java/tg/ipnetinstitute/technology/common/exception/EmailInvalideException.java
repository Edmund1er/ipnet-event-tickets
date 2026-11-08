package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;

public class EmailInvalideException extends MetierException {
    public EmailInvalideException(String email) {
        super("L'adresse e-mail renseignée n'est pas valide : " + email, HttpStatus.BAD_REQUEST, "RG-01");
    }
}
