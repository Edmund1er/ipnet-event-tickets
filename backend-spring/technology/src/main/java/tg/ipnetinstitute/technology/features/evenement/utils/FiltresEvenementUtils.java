package tg.ipnetinstitute.technology.features.evenement.utils;

public final class FiltresEvenementUtils {
    private FiltresEvenementUtils() {}

    public static String nettoyerCritere(String critere) {
        return critere != null ? critere.trim() : null;
    }
}
