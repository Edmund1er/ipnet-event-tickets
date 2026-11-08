package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;

public class TelephoneDejaUtiliseException extends MetierException {
    public TelephoneDejaUtiliseException(String telephone) {
        super("Ce numéro de téléphone est déjà associé à un compte : " + telephone, HttpStatus.CONFLICT, "RG-02");
    }
}
