package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;

public class CategorieInvalideException extends MetierException {
    public CategorieInvalideException(Long categorieId) {
        super("Catégorie de visiteur inexistante ou inactive : " + categorieId, HttpStatus.BAD_REQUEST, "RG-05");
    }
}
