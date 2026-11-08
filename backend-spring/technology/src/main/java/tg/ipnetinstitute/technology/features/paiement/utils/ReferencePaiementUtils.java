package tg.ipnetinstitute.technology.features.paiement.utils;

public final class ReferencePaiementUtils {
    private ReferencePaiementUtils() {}

    public static String normaliser(String reference) {
        if (reference == null) return null;
        return reference.trim().replaceAll("\\s+", "").toUpperCase();
    }
}
