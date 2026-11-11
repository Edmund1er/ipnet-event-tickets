package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;

public class CompteInactifException extends MetierException {
    public CompteInactifException(Long utilisateurId) {
        super("Ce compte est désactivé : cette action n'est pas possible", HttpStatus.FORBIDDEN, "RG-18");
    }
}
