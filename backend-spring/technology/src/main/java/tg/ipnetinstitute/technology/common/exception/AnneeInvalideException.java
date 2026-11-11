package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;

public class AnneeInvalideException extends MetierException {
    public AnneeInvalideException(int annee) {
        super("L'année d'inscription en L1 ne peut pas être postérieure à l'année en cours", HttpStatus.BAD_REQUEST, "RG-04");
    }
}
