package tg.ipnetinstitute.technology.features.identite.application;

import tg.ipnetinstitute.technology.features.identite.domaine.Role;
import tg.ipnetinstitute.technology.features.participant.domaine.TypeProfil;

public record ReponseInscription(
        Long utilisateurId,
        String email,
        String telephone,
        TypeProfil typeProfil,
        Role role,
        String message
) {}
