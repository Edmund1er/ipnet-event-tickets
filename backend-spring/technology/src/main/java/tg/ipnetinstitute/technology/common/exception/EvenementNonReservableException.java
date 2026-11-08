package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;
import tg.ipnetinstitute.technology.features.evenement.domaine.StatutEvenement;

public class EvenementNonReservableException extends MetierException {
    public EvenementNonReservableException(Long evenementId, StatutEvenement statut) {
        super("L'événement " + evenementId + " n'est pas ouvert aux réservations (statut: " + statut + ")", HttpStatus.BAD_REQUEST, "RG-07");
    }
}
