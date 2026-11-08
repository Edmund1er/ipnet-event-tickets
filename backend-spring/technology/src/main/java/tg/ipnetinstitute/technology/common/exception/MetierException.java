package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception racine du domaine pour normalisation RFC 9457 ProblemDetail.
 */
public abstract class MetierException extends RuntimeException {

    private final HttpStatus status;
    private final String codeRegle;

    protected MetierException(String message, HttpStatus status, String codeRegle) {
        super(message);
        this.status = status;
        this.codeRegle = codeRegle;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCodeRegle() {
        return codeRegle;
    }
}
