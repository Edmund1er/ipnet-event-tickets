package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;

public class AnneeInvalideException extends MetierException {
    public AnneeInvalideException(int annee) {
        super("L'année d'inscription L1 ne peut pas être supérieure à l'année courante : " + annee, HttpStatus.BAD_REQUEST, "RG-04");
    }
}
