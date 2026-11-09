package tg.ipnetinstitute.technology.features.identite.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Types scellés Java 21 pour les demandes de profil (Section 9.2).
 */
public sealed interface DemandeProfil permits DemandeProfil.DemandeEtudiant, DemandeProfil.DemandeVisiteur {

    record DemandeEtudiant(
            @NotBlank @Size(max = 100) String nom,
            @NotBlank @Size(max = 100) String prenom,
            @NotNull Long filiereId,
            @NotNull Integer anneeInscriptionL1
    ) implements DemandeProfil {}

    record DemandeVisiteur(
            @NotBlank @Size(max = 100) String nom,
            @NotBlank @Size(max = 100) String prenom,
            @NotNull Long categorieId,
            @Size(max = 150) String organisation
    ) implements DemandeProfil {}
}
