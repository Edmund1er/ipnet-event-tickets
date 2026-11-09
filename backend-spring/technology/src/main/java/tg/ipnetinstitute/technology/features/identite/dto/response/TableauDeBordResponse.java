package tg.ipnetinstitute.technology.features.identite.dto.response;

/** Indicateurs du tableau de bord administrateur (valeurs calculées en base, temps réel). */
public record TableauDeBordResponse(
        long evenementsPublies,
        long evenementsBrouillons,
        long reservationsEnAttentePaiement,
        long reservationsConfirmees,
        long paiementsATraiter,
        long paiementsARembourser,
        long billetsValides,
        long billetsScannes,
        long notificationsEnEchec,
        boolean paiementConfigure,
        boolean smtpConfigure
) {}
