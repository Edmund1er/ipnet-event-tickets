package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;
import tg.ipnetinstitute.technology.features.evenement.model.StatutEvenement;

public class TransitionEvenementIllegaleException extends MetierException {
    public TransitionEvenementIllegaleException(Long evenementId, StatutEvenement statut) {
        super("Impossible d'annuler l'evenement " + evenementId + " dans son statut actuel : " + statut, HttpStatus.CONFLICT, "RG-19");
    }
}
