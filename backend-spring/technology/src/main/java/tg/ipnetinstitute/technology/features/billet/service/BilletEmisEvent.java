package tg.ipnetinstitute.technology.features.billet.service;

import java.util.UUID;

public record BilletEmisEvent(UUID billetId, Long inscriptionId) {}
