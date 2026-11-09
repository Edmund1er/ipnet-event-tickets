package tg.ipnetinstitute.technology.features.controle.dto.response;

import java.util.List;

/**
 * EF-44 : compteurs temps réel. nombreRestants = billets confirmés non encore scannés.
 * personnes : entrées triées de la plus récente à la plus ancienne.
 */
public record StatistiquesEvenement(
        Long evenementId,
        long nombreEntrees,
        long nombreBilletsConfirmes,
        long nombreRestants,
        List<PersonneEntree> personnes
) {}
