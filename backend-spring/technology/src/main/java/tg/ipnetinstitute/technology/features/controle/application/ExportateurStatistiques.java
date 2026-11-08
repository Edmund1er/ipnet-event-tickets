package tg.ipnetinstitute.technology.features.controle.application;

/**
 * Strategy pour l'export des statistiques (Section 9.8).
 */
public interface ExportateurStatistiques {
    FormatExport format();
    byte[] exporter(StatistiquesEvenement statistiques);
}
