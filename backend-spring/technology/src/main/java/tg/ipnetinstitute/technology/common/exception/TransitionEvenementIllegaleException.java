package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;
import tg.ipnetinstitute.technology.features.evenement.model.StatutEvenement;

public class TransitionEvenementIllegaleException extends MetierException {
    public TransitionEvenementIllegaleException(Long evenementId, StatutEvenement statut) {
        super("Cette action n'est pas possible : l'événement est déjà " + (statut == StatutEvenement.ANNULE ? "annulé" : statut == StatutEvenement.TERMINE ? "terminé" : "dans un état qui ne le permet pas"), HttpStatus.CONFLICT, "RG-19");
    }
}
