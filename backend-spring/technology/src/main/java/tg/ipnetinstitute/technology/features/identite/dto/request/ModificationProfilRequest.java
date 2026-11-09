package tg.ipnetinstitute.technology.features.identite.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * EF-08 : modification du profil. Le type de profil n'est pas modifiable ; l'e-mail se change par
 * une procédure dédiée avec code de confirmation. Nom et prénom sont exigés pour les
 * participants (contrôle dans le service) ; les comptes de service ne modifient que leur téléphone.
 */
public record ModificationProfilRequest(
        @Size(max = 100) String nom,
        @Size(max = 100) String prenom,
        @NotBlank String telephone,
        @Size(max = 150) String organisation
) {}
