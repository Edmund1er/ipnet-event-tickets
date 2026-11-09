package tg.ipnetinstitute.technology.features.paiement.wrapper;

import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

/**
 * Lecture du relevé opérateur (EF-26) : colonnes référence, montant, date (facultative).
 * Séparateur ";" ou ",", première ligne = en-tête. Isolé ici pour pouvoir adapter le format
 * exact de l'opérateur (hypothèse 14 du cahier) sans toucher au service.
 */
@Component
public class ReleveCsvWrapper {

    public record LigneReleve(int numeroLigne, String reference, BigDecimal montant, LocalDateTime date) {}

    private static final List<DateTimeFormatter> FORMATS_DATE_HEURE = List.of(
            DateTimeFormatter.ISO_LOCAL_DATE_TIME,
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
    private static final List<DateTimeFormatter> FORMATS_DATE = List.of(
            DateTimeFormatter.ISO_LOCAL_DATE,
            DateTimeFormatter.ofPattern("dd/MM/yyyy"));

    public List<LigneReleve> parserCsv(InputStream stream) {
        List<LigneReleve> lignes = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            String line;
            int numero = 0;
            while ((line = reader.readLine()) != null) {
                numero++;
                if (numero == 1 || line.isBlank()) continue; // en-tête ou ligne vide
                String[] parts = line.split(line.contains(";") ? ";" : ",");
                if (parts.length < 2) {
                    throw new IllegalArgumentException("Relevé CSV invalide, ligne " + numero + " : au moins 2 colonnes attendues (référence, montant)");
                }
                String ref = parts[0].trim().replace("\"", "");
                BigDecimal montant;
                try {
                    montant = new BigDecimal(parts[1].trim().replace("\"", "").replace(" ", ""));
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("Relevé CSV invalide, ligne " + numero + " : montant illisible « " + parts[1].trim() + " »");
                }
                LocalDateTime date = parts.length > 2 ? lireDate(parts[2].trim().replace("\"", "")) : null;
                if (!ref.isEmpty()) {
                    lignes.add(new LigneReleve(numero, ref, montant, date));
                }
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("Impossible de lire le relevé CSV", e);
        }
        return lignes;
    }

    private static LocalDateTime lireDate(String valeur) {
        if (valeur.isEmpty()) return null;
        for (DateTimeFormatter f : FORMATS_DATE_HEURE) {
            try { return LocalDateTime.parse(valeur, f); } catch (DateTimeParseException ignored) { }
        }
        for (DateTimeFormatter f : FORMATS_DATE) {
            try { return LocalDate.parse(valeur, f).atStartOfDay(); } catch (DateTimeParseException ignored) { }
        }
        return null; // date facultative : une date illisible n'empêche pas le rapprochement
    }
}
