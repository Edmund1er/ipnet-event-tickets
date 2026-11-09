package tg.ipnetinstitute.technology.features.identite.dto.response;

import tg.ipnetinstitute.technology.features.identite.model.Role;

/**
 * Jetons émis par le service d'authentification (usage interne au contrôleur :
 * le refreshToken part en cookie HttpOnly, le reste dans SessionResponse).
 */
public record TokensAcces(
        String accessToken,
        String refreshToken,
        long expireDans,
        Long utilisateurId,
        Role role,
        boolean emailVerifie
) {
    public SessionResponse versSession() {
        return new SessionResponse(accessToken, expireDans, utilisateurId, role, emailVerifie);
    }
}
