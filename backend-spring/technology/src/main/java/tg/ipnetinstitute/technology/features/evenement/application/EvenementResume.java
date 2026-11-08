package tg.ipnetinstitute.technology.features.evenement.application;

import tg.ipnetinstitute.technology.features.evenement.domaine.StatutEvenement;

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
