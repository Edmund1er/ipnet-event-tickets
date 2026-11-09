package tg.ipnetinstitute.technology.features.identite.dto.response;

import tg.ipnetinstitute.technology.features.identite.model.Role;

/**
 * Réponse de connexion / rafraîchissement. Le refresh token n'apparaît jamais ici :
 * il est uniquement posé en cookie HttpOnly.
 */
public record SessionResponse(
        String accessToken,
        long expireDans,
        Long utilisateurId,
        Role role,
        boolean emailVerifie
) {}
