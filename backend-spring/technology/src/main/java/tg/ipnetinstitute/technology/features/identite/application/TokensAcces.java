package tg.ipnetinstitute.technology.features.identite.application;

public record TokensAcces(
        String accessToken,
        String refreshToken,
        long expireDans
) {}
