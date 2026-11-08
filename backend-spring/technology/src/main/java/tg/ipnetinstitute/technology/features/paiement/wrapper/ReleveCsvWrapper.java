package tg.ipnetinstitute.technology.features.paiement.wrapper;

import org.springframework.stereotype.Component;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Component
public class ReleveCsvWrapper {

    public record LigneReleve(String reference, BigDecimal montant, String devise) {}

    public List<LigneReleve> parserCsv(InputStream stream) {
        List<LigneReleve> lignes = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            String line;
            boolean header = true;
            while ((line = reader.readLine()) != null) {
                if (header) { 
                    header = false; 
                    continue; 
                }
                String[] parts = line.split(";");
                if (parts.length >= 2) {
                    String ref = parts[0].trim();
                    BigDecimal mnt = new BigDecimal(parts[1].trim());
                    String dev = parts.length > 2 ? parts[2].trim() : "XOF";
                    lignes.add(new LigneReleve(ref, mnt, dev));
                }
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Erreur de lecture du releve CSV operateur", e);
        }
        return lignes;
    }
}
