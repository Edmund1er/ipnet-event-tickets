package tg.ipnetinstitute.technology.features.evenement.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

/** Recopie des activités d'un jour vers d'autres jours du programme. */
public record DuplicationJour(@NotNull LocalDate source, @NotEmpty List<LocalDate> cibles) {}
