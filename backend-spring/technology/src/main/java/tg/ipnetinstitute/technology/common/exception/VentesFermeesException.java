package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;

/** Les ventes sont fermées (suspension par l'administration ou date limite dépassée). */
public class VentesFermeesException extends MetierException {
    public VentesFermeesException(boolean suspendues) {
        super(suspendues
                        ? "Les réservations sont momentanément fermées pour cet événement"
                        : "La date limite de réservation de cet événement est dépassée",
                HttpStatus.CONFLICT, "VENTES_FERMEES");
    }
}
