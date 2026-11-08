package tg.ipnetinstitute.technology.features.billet.wrapper;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;

@Component
public class GenerateurQrCodeZxingImpl implements QrZxingWrapper {

    @Override
    public byte[] generer(String contenu, int taille) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(contenu, BarcodeFormat.QR_CODE, taille, taille);
            ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            return pngOutputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération du QR code ZXing", e);
        }
    }
}
