package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;

public class CategorieInvalideException extends MetierException {
    public CategorieInvalideException(Long categorieId) {
        super("Cette catégorie de visiteur n'est pas disponible", HttpStatus.BAD_REQUEST, "RG-05");
    }
}
