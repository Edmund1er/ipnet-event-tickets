package tg.ipnetinstitute.technology.features.controle.wrapper;

import org.springframework.stereotype.Component;
import tg.ipnetinstitute.technology.features.controle.dto.request.FormatExport;
import tg.ipnetinstitute.technology.features.controle.dto.response.PersonneEntree;
import tg.ipnetinstitute.technology.features.controle.dto.response.StatistiquesEvenement;
import tg.ipnetinstitute.technology.features.evenement.dto.response.EvenementResume;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;

/** Export CSV (séparateur ";", UTF-8 avec BOM pour une ouverture directe dans Excel). */
@Component
public class ExportCsvWrapper implements ExportateurStatistiques {

    private static final DateTimeFormatter FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    @Override
    public FormatExport format() {
        return FormatExport.CSV;
    }

    @Override
    public byte[] exporter(EvenementResume evenement, StatistiquesEvenement statistiques) {
        StringBuilder sb = new StringBuilder();
        sb.append("Nom;Prénom;Profil;Heure d'entrée\r\n");
        statistiques.personnes().stream()
                .sorted(Comparator.comparing(PersonneEntree::entreeLe))
                .forEach(p -> sb.append(champ(p.nom())).append(';')
                        .append(champ(p.prenom())).append(';')
                        .append(champ(p.detail())).append(';')
                        .append(champ(p.entreeLe() == null ? "" : FORMAT.format(p.entreeLe()))).append("\r\n"));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.writeBytes(new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF});
        out.writeBytes(sb.toString().getBytes(StandardCharsets.UTF_8));
        return out.toByteArray();
    }

    /** Échappement CSV + neutralisation des formules (injection CSV / DDE). */
    private static String champ(String valeur) {
        String v = valeur == null ? "" : valeur;
        if (!v.isEmpty() && "=+-@\t\r".indexOf(v.charAt(0)) >= 0) {
            v = "'" + v;
        }
        return "\"" + v.replace("\"", "\"\"") + "\"";
    }
}
