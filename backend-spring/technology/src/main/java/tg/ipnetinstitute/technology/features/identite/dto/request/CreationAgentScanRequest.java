package tg.ipnetinstitute.technology.features.identite.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** EF-52 : création d'un compte agent de scan. */
public record CreationAgentScanRequest(
        @NotBlank String email,
        @NotBlank String telephone,
        @NotBlank @Size(min = 6, message = "Le mot de passe doit comporter au moins 6 caractères") String motDePasse
) {}
