package tg.ipnetinstitute.technology.features.identite.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** Validation du code reçu par e-mail : c'est cette étape qui crée le compte. */
public record VerificationInscriptionRequest(
        @NotBlank String email,
        @NotBlank @Pattern(regexp = "\\d{6}", message = "Le code comporte 6 chiffres") String code
) {}
