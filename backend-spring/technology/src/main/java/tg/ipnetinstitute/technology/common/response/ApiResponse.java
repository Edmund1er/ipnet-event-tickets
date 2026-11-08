package tg.ipnetinstitute.technology.common.response;

import java.time.LocalDateTime;

public record ApiResponse<T>(
        boolean succes,
        String message,
        T donnees,
        LocalDateTime timestamp
) {
    public static <T> ApiResponse<T> succes(T donnees, String message) {
        return new ApiResponse<>(true, message, donnees, LocalDateTime.now());
    }

    public static <T> ApiResponse<T> succes(T donnees) {
        return succes(donnees, "Operation realisee avec succes");
    }

    public static <T> ApiResponse<T> erreur(String message) {
        return new ApiResponse<>(false, message, null, LocalDateTime.now());
    }
}
