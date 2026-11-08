package tg.ipnetinstitute.technology.features.evenement.application;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ModificationEvenement(
        @NotBlank String titre,
        String description,
        @NotNull @Future LocalDateTime dateDebut,
        String lieu,
        @NotNull @Min(0) BigDecimal prix,
        @NotBlank String devise,
        @NotNull @Min(1) Integer capacite
) {}
