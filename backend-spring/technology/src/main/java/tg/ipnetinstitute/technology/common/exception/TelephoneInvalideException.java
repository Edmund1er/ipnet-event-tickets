package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;

public class TelephoneInvalideException extends MetierException {
    public TelephoneInvalideException(String telephone) {
        super("Le numéro de téléphone n'est pas au format international E.164 valide : " + telephone, HttpStatus.BAD_REQUEST, "RG-02");
    }
}
