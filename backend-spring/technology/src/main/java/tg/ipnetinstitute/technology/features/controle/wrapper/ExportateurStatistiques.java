package tg.ipnetinstitute.technology.features.controle.wrapper;
import tg.ipnetinstitute.technology.features.controle.dto.request.FormatExport;
import tg.ipnetinstitute.technology.features.controle.dto.response.StatistiquesEvenement;

/**
 * Strategy pour l'export des statistiques (Section 9.8).
 */
public interface ExportateurStatistiques {
    FormatExport format();
    byte[] exporter(StatistiquesEvenement statistiques);
}
