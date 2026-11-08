package tg.ipnetinstitute.technology.features.controle.application;

import java.util.List;

public record StatistiquesEvenement(
        long nombreEntrees,
        long nombreBilletsConfirmes,
        List<PersonneEntree> personnes
) {}
