package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;

public class UtilisateurNonAutoriseException extends MetierException {
    public UtilisateurNonAutoriseException(Long utilisateurId) {
        super("L'utilisateur n'est pas vérifié par téléphone ou son compte est inactif : " + utilisateurId, HttpStatus.FORBIDDEN, "RG-07");
    }
}
