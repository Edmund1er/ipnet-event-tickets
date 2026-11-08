package tg.ipnetinstitute.technology.features.identite.dto.response;

public record TokensAcces(
        String accessToken,
        String refreshToken,
        long expireDans
) {}
