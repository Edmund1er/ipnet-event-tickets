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
        StatutEvenement statut
) {}
