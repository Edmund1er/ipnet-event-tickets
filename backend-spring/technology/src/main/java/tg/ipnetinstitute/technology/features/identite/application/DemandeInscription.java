package tg.ipnetinstitute.technology.features.identite.application;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import tg.ipnetinstitute.technology.features.participant.domaine.TypeProfil;

/**
 * DTO d'inscription avec validation déclarative (Section 5.3).
 */
public record DemandeInscription(
        @NotBlank String email,
        @NotBlank String telephone,
        @NotBlank @Size(min = 12, message = "Le mot de passe doit comporter au moins 12 caractères") String motDePasse,
        @NotNull TypeProfil typeProfil,
        // Données profil étudiant
        Long filiereId,
        Integer anneeInscriptionL1,
        // Données profil visiteur
        Long categorieId,
        String organisation,
        // Données communes nom / prénom / adresse
        @NotBlank String nom,
        @NotBlank String prenom,
        @NotBlank String adresse
) {}
