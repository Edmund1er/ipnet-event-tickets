package tg.ipnetinstitute.technology.features.reservation.utils;

import java.time.LocalDateTime;

public final class DelaiExpirationUtils {
    public static final int DELAI_EXPIRATION_HEURES = 48;

    private DelaiExpirationUtils() {}

    public static LocalDateTime calculerExpiration(LocalDateTime debut) {
        return debut.plusHours(DELAI_EXPIRATION_HEURES);
    }
}
