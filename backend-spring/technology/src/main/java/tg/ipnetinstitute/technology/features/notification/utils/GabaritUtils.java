package tg.ipnetinstitute.technology.features.notification.utils;

public final class GabaritUtils {
    private GabaritUtils() {}

    public static String formaterMessage(String modele, String nom, String details) {
        return String.format("[%s] Bonjour %s, %s", modele, nom != null ? nom : "Participant", details);
    }
}
