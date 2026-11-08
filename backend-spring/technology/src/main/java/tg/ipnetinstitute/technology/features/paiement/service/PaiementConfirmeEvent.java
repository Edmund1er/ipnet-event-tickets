package tg.ipnetinstitute.technology.features.paiement.service;

public record PaiementConfirmeEvent(Long inscriptionId, Long paiementId, Long validePar) {}
