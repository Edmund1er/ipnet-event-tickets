package tg.ipnetinstitute.technology.features.identite.utils;

public final class EmailNormaliseur {
    private EmailNormaliseur() {}

    public static String normaliser(String email) {
        if (email == null) return null;
        return email.trim().toLowerCase();
    }
}
