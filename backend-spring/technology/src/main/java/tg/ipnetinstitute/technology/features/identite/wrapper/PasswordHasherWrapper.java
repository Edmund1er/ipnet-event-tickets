package tg.ipnetinstitute.technology.features.identite.wrapper;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class PasswordHasherWrapper {
    private final PasswordEncoder encoder;

    public PasswordHasherWrapper(PasswordEncoder encoder) {
        this.encoder = encoder;
    }

    public String hasher(String motDePasseClair) {
        return encoder.encode(motDePasseClair);
    }

    public boolean verifier(String motDePasseClair, String motDePasseHache) {
        return encoder.matches(motDePasseClair, motDePasseHache);
    }
}
