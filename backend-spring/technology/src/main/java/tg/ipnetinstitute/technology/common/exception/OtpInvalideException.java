package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;

public class OtpInvalideException extends MetierException {
    public OtpInvalideException(String message) {
        super(message, HttpStatus.BAD_REQUEST, "RG-03");
    }
}
