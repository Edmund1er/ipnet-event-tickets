package tg.ipnetinstitute.technology.features.controle.infrastructure;

import org.springframework.stereotype.Component;
import tg.ipnetinstitute.technology.features.controle.application.ExportateurStatistiques;
import tg.ipnetinstitute.technology.features.controle.application.FormatExport;
import tg.ipnetinstitute.technology.features.controle.application.StatistiquesEvenement;

import java.nio.charset.StandardCharsets;

@Component
public class ExportateurCsv implements ExportateurStatistiques {

    @Override
    public FormatExport format() {
        return FormatExport.CSV;
    }

    @Override
    public byte[] exporter(StatistiquesEvenement statistiques) {
        StringBuilder sb = new StringBuilder();
        sb.append("Nom,Prénom,Adresse,Date d'entrée\n");
        for (var p : statistiques.personnes()) {
            sb.append("\"").append(p.nom()).append("\",")
              .append("\"").append(p.prenom()).append("\",")
              .append("\"").append(p.adresse()).append("\",")
              .append("\"").append(p.entreeLe()).append("\"\n");
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }
}
