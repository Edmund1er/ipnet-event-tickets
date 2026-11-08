package tg.ipnetinstitute.technology.features.billet.application;

import java.util.UUID;

public record BilletEmisEvent(UUID billetId, Long inscriptionId) {}
