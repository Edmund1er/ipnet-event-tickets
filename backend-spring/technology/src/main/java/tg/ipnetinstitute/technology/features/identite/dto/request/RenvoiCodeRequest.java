package tg.ipnetinstitute.technology.features.identite.dto.request;

import jakarta.validation.constraints.NotBlank;

public record RenvoiCodeRequest(@NotBlank String email) {}
