package tg.ipnetinstitute.technology.features.evenement.service;

public record EvenementAnnuleEvent(
        Long evenementId,
        Long adminId,
        String motif
) {}
