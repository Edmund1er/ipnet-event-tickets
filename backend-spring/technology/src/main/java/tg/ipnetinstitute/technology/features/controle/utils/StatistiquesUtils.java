package tg.ipnetinstitute.technology.features.controle.utils;

public final class StatistiquesUtils {
    private StatistiquesUtils() {}

    public static double calculerTauxPresence(long entres, long total) {
        if (total == 0) return 0.0;
        return (double) entres / total * 100.0;
    }
}
