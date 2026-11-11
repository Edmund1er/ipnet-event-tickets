package tg.ipnetinstitute.technology.features.evenement.dto.response;

import tg.ipnetinstitute.technology.features.evenement.model.StatutEvenement;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record EvenementResume(
        Long id,
        String titre,
        String description,
        LocalDateTime dateDebut,
        String lieu,
        BigDecimal prix,
        String devise,
        int capacite,
        int placesReservees,
        StatutEvenement statut,
        boolean aImage,
        LocalDateTime dateLimiteReservation,
        boolean ventesSuspendues,
        boolean ventesOuvertes
) {
    @com.fasterxml.jackson.annotation.JsonProperty("placesRestantes")
    public int placesRestantes() {
        return Math.max(0, capacite - placesReservees);
    }
}
