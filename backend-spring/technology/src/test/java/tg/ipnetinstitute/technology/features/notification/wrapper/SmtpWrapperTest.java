package tg.ipnetinstitute.technology.features.notification.wrapper;

import org.junit.jupiter.api.Test;
import tg.ipnetinstitute.technology.features.notification.wrapper.CanalNotification.PieceJointe;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SmtpWrapperTest {

    @Test
    void brevoApiRetireLaBaliseCidMaisConserveLeTexteEtLaPieceJointe() {
        var piece = new PieceJointe("billet-ipnet.png", "image-test".getBytes(StandardCharsets.UTF_8), "image/png", "qrcode");
        String html = "<p>QR joint à l'e-mail</p><p><img src=\"cid:qrcode\" alt=\"QR\"></p>";

        String sansCid = SmtpWrapper.retirerImagesCidNonSupportesParApi(html, List.of(piece));

        assertThat(sansCid).contains("QR joint à l'e-mail").doesNotContain("cid:qrcode").doesNotContain("<img");
        assertThat(piece.nomFichier()).isEqualTo("billet-ipnet.png");
    }
}
