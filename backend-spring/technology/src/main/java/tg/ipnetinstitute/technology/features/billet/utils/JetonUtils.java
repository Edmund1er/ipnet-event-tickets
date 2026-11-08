package tg.ipnetinstitute.technology.features.billet.utils;

import java.util.Base64;

public final class JetonUtils {
    private JetonUtils() {}

    public static String encoderUrl(byte[] data) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(data);
    }

    public static byte[] decoderUrl(String source) {
        return Base64.getUrlDecoder().decode(source);
    }
}
