package tg.ipnetinstitute.technology.features.evenement.application;

public record EvenementAnnuleEvent(
        Long evenementId,
        Long adminId,
        String motif
) {}
