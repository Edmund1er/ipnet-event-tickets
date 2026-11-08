package tg.ipnetinstitute.technology.features.controle.wrapper;

import org.springframework.stereotype.Component;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

@Component
public class ExportPdfWrapper {
    public byte[] genererPdf(String rapportTexte) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        baos.writeBytes(rapportTexte.getBytes(StandardCharsets.UTF_8));
        return baos.toByteArray();
    }
}
