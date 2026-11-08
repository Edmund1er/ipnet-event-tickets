package tg.ipnetinstitute.technology.features.paiement.application;

public record PaiementConfirmeEvent(Long inscriptionId, Long paiementId, Long validePar) {}
