package tg.ipnetinstitute.technology.features.evenement.wrapper;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

@Component
public class StockageImageWrapper {
    public String stockerImage(MultipartFile fichier) throws IOException {
        if (fichier == null || fichier.isEmpty()) return null;
        return "uploads/images/" + fichier.getOriginalFilename();
    }
}
