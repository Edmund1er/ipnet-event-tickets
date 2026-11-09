package tg.ipnetinstitute.technology.features.identite.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ConnexionRequest(
        @NotBlank(message = "L'e-mail est obligatoire") String email,
        @NotBlank(message = "Le mot de passe est obligatoire") String motDePasse
) {}
