package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;

public class CapaciteAtteinteException extends MetierException {
    public CapaciteAtteinteException(Long evenementId) {
        super("La capacité maximale pour cet événement a été atteinte : " + evenementId, HttpStatus.CONFLICT, "RG-08");
    }
}
