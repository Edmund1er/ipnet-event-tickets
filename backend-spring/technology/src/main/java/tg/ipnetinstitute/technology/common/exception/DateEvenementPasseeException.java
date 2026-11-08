package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;

public class DateEvenementPasseeException extends MetierException {
    public DateEvenementPasseeException(Long evenementId) {
        super("Impossible de publier ou réserver : la date de l'événement est passée : " + evenementId, HttpStatus.BAD_REQUEST, "RG-07");
    }
}
