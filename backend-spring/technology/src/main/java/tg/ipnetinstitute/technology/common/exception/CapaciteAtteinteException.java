package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;

public class CapaciteAtteinteException extends MetierException {
    public CapaciteAtteinteException(Long evenementId) {
        super("Cet événement est complet : il n'y a plus de place disponible", HttpStatus.CONFLICT, "RG-08");
    }
}
