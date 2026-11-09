package tg.ipnetinstitute.technology.features.identite.dto.request;

import jakarta.validation.constraints.NotBlank;

/** Confirmation par mot de passe avant suppression du compte (§5.2). */
public record SuppressionCompteRequest(
        @NotBlank(message = "Le mot de passe est obligatoire") String motDePasse
) {}
