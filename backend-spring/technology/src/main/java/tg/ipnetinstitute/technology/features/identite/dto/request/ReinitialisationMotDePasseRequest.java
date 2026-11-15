package tg.ipnetinstitute.technology.features.identite.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReinitialisationMotDePasseRequest(
        @NotBlank(message = "Le jeton est obligatoire") String jeton,
        @NotBlank @Size(min = 12, message = "Le mot de passe doit comporter au moins 12 caractères") String nouveauMotDePasse
) {}
