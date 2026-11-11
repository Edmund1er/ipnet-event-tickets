package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;
import tg.ipnetinstitute.technology.features.evenement.model.StatutEvenement;

public class EvenementNonReservableException extends MetierException {
    public EvenementNonReservableException(Long evenementId, StatutEvenement statut) {
        super("Cet événement n'est pas ouvert aux réservations", HttpStatus.BAD_REQUEST, "RG-07");
    }
}
