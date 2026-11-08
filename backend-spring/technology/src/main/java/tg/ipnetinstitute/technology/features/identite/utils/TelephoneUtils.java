package tg.ipnetinstitute.technology.features.identite.utils;

import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.Phonenumber.PhoneNumber;

public final class TelephoneUtils {
    private static final PhoneNumberUtil UTIL = PhoneNumberUtil.getInstance();

    private TelephoneUtils() {}

    public static String formaterE164(String telephone) {
        if (telephone == null || telephone.isBlank()) return null;
        try {
            PhoneNumber pn = UTIL.parse(telephone.trim(), "TG");
            if (!UTIL.isValidNumber(pn)) {
                throw new IllegalArgumentException("Numéro de téléphone invalide : " + telephone);
            }
            return UTIL.format(pn, PhoneNumberUtil.PhoneNumberFormat.E164);
        } catch (NumberParseException e) {
            throw new IllegalArgumentException("Format de téléphone invalide : " + telephone, e);
        }
    }
}
