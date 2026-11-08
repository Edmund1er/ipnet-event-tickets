package tg.ipnetinstitute.technology.features.identite.dto.response;

import tg.ipnetinstitute.technology.features.identite.model.Role;
import tg.ipnetinstitute.technology.features.identite.model.TypeProfil;

public record ReponseInscription(
        Long utilisateurId,
        String email,
        String telephone,
        TypeProfil typeProfil,
        Role role,
        String message
) {}
