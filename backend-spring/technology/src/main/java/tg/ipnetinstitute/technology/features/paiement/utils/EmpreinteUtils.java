package tg.ipnetinstitute.technology.features.paiement.utils;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

public final class EmpreinteUtils {
    private EmpreinteUtils() {}

    public static String calculerSha256(byte[] contenu) {
        if (contenu == null) return null;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(contenu));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Algorithme SHA-256 introuvable", e);
        }
    }
}
