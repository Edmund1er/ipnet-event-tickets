package tg.ipnetinstitute.technology.features.identite.controller;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import tg.ipnetinstitute.technology.features.identite.wrapper.JwtWrapper;

import java.time.Duration;

/** Pose / efface le cookie du refresh token (HttpOnly, Secure, SameSite=Strict, limité à /api/auth). */
@Component
public class CookieRafraichissement {

    public static final String NOM = "refreshToken";
    private static final String CHEMIN = "/api/auth";

    private final JwtWrapper jwtWrapper;
    private final boolean secure;

    public CookieRafraichissement(JwtWrapper jwtWrapper, @Value("${app.security.cookie.secure:true}") boolean secure) {
        this.jwtWrapper = jwtWrapper;
        this.secure = secure;
    }

    public void poser(HttpServletResponse response, String refreshToken) {
        response.addHeader(HttpHeaders.SET_COOKIE, cookie(refreshToken, Duration.ofSeconds(jwtWrapper.dureeRefreshSecondes())).toString());
    }

    public void effacer(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, cookie("", Duration.ZERO).toString());
    }

    private ResponseCookie cookie(String valeur, Duration duree) {
        return ResponseCookie.from(NOM, valeur).httpOnly(true).secure(secure).sameSite("Strict").path(CHEMIN).maxAge(duree).build();
    }
}
