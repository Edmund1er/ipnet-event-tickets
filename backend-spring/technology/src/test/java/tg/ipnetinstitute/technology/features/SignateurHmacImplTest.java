package tg.ipnetinstitute.technology.features;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import tg.ipnetinstitute.technology.features.billet.wrapper.SignateurHmacImpl;
import tg.ipnetinstitute.technology.features.identite.wrapper.JwtWrapper;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SignateurHmacImplTest {

    @Test
    void secretAbsentEstRefuseEnProduction() {
        var environnement = new MockEnvironment();
        environnement.setActiveProfiles("prod");

        assertThatThrownBy(() -> new SignateurHmacImpl("", environnement))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("QR_HMAC_SECRET");
    }

    @Test
    void secretLocalEphemerePermetDeSignerEtDeVerifierSansValeurFixe() {
        var environnement = new MockEnvironment();
        environnement.setActiveProfiles("local");
        var signateur = new SignateurHmacImpl("", environnement);
        UUID billetId = UUID.randomUUID();
        String jeton = signateur.signer(billetId, "nonce-test", 42L);

        assertThat(signateur.verifier(jeton, 42L, "nonce-test")).contains(billetId);
        assertThat(signateur.verifier(jeton, 43L, "nonce-test")).isEmpty();
    }

    @Test
    void secretJwtAbsentEstRefuseEnProduction() {
        var environnement = new MockEnvironment();
        environnement.setActiveProfiles("production");

        assertThatThrownBy(() -> new JwtWrapper("", environnement))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
    }

    @Test
    void refuseUneCleConfigureeTropCourte() {
        var environnement = new MockEnvironment();
        environnement.setActiveProfiles("local");
        assertThatThrownBy(() -> new SignateurHmacImpl("trop-court", environnement))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32 octets");
    }
}
