package tg.ipnetinstitute.technology.features.controle.dto.response;

import java.util.List;

public record StatistiquesEvenement(
        long nombreEntrees,
        long nombreBilletsConfirmes,
        List<PersonneEntree> personnes
) {}
