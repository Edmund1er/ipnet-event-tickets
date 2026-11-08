package tg.ipnetinstitute.technology.common.utils;

import tg.ipnetinstitute.technology.common.exception.EmailInvalideException;

import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Adresse e-mail normalisée et validée selon RG-01 et RFC 5322.
 * Immuable (Value Object).
 */
public record Email(String valeur) {

    private static final Pattern FORMAT = Pattern.compile("^[\\w.+-]+@[\\w-]+(\\.[\\w-]+)+$");

    public Email {
        if (valeur == null) {
            throw new EmailInvalideException(null);
        }
        valeur = valeur.trim().toLowerCase(Locale.ROOT);
        if (!FORMAT.matcher(valeur).matches()) {
            throw new EmailInvalideException(valeur);
        }
    }
}
