package tg.ipnetinstitute.technology.features.identite.wrapper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class OtpSenderWrapper {
    private static final Logger log = LoggerFactory.getLogger(OtpSenderWrapper.class);

    public void envoyerOtp(String telephoneE164, String codeOtp) {
        log.info("[OTP SMS SIMULATION] Envoi du code OTP {} au numero {}", codeOtp, telephoneE164);
    }
}
