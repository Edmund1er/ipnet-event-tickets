package tg.ipnetinstitute.technology.features.controle.wrapper;

import tg.ipnetinstitute.technology.features.controle.dto.request.FormatExport;
import tg.ipnetinstitute.technology.features.controle.dto.response.StatistiquesEvenement;
import tg.ipnetinstitute.technology.features.evenement.dto.response.EvenementResume;

/**
 * Strategy pour l'export de la liste des présents (EF-45). Ajouter un format = ajouter une implémentation.
 */
public interface ExportateurStatistiques {
    FormatExport format();

    byte[] exporter(EvenementResume evenement, StatistiquesEvenement statistiques);
}
