package tg.ipnetinstitute.technology.features.identite.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReinitialisationMotDePasseRequest(
        @NotBlank(message = "Le jeton est obligatoire") String jeton,
        @NotBlank @Size(min = 6, message = "Le mot de passe doit comporter au moins 6 caractères") String nouveauMotDePasse
) {}
