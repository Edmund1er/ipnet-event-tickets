package tg.ipnetinstitute.technology.features.evenement.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record DemandeEvenement(
        @NotBlank @jakarta.validation.constraints.Size(max = 200) String titre,
        String description,
        @NotNull @Future(message = "La date doit être dans le futur") LocalDateTime dateDebut,
        @jakarta.validation.constraints.Size(max = 255) String lieu,
        @NotNull @Min(0) BigDecimal prix,
        @NotBlank @jakarta.validation.constraints.Size(min = 3, max = 3, message = "Code devise ISO à 3 lettres (ex. XOF)") String devise,
        @NotNull @Min(1) Integer capacite
) {}
