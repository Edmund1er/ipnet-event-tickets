package tg.ipnetinstitute.technology.common.utils;

import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.PhoneNumberUtil.PhoneNumberFormat;
import tg.ipnetinstitute.technology.common.exception.TelephoneInvalideException;

/**
 * Numéro de téléphone au format E.164 (RG-02).
 * Validé via Google libphonenumber.
 */
public record Telephone(String valeur) {

    private static final PhoneNumberUtil UTIL = PhoneNumberUtil.getInstance();

    public Telephone {
        valeur = normaliser(valeur);
    }

    private static String normaliser(String brut) {
        if (brut == null || brut.isBlank()) {
            throw new TelephoneInvalideException("Numéro de téléphone invalide (format international attendu).");
        }
        try {
            // null région : impose l'indicatif international
            var numero = UTIL.parse(brut.trim(), null);
            if (!UTIL.isValidNumber(numero)) {
                throw new TelephoneInvalideException("Numéro de téléphone invalide (format international attendu).");
            }
            return UTIL.format(numero, PhoneNumberFormat.E164);
        } catch (NumberParseException e) {
            throw new TelephoneInvalideException("Numéro de téléphone invalide (format international attendu).");
        }
    }
}
