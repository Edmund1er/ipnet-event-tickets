package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;

public class CompteInactifException extends MetierException {
    public CompteInactifException(Long utilisateurId) {
        super("Le compte est désactivé et ne peut pas effectuer cette action : " + utilisateurId, HttpStatus.FORBIDDEN, "RG-18");
    }
}
