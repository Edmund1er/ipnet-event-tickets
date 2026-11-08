package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;

public class FiliereVerrouilleeException extends MetierException {
    public FiliereVerrouilleeException(Long utilisateurId) {
        super("La filiere de l'etudiant " + utilisateurId + " est verrouillee (RG-04).", HttpStatus.BAD_REQUEST, "RG-04");
    }
}
