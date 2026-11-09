package tg.ipnetinstitute.technology.common.validation.telephone;

import com.google.i18n.phonenumbers.PhoneNumberUtil.PhoneNumberType;
import com.google.i18n.phonenumbers.Phonenumber.PhoneNumber;

/**
 * Résultat de l'analyse d'un numéro par les métadonnées libphonenumber.
 *
 * @param e164                 format de stockage (+22890123456)
 * @param international        format d'affichage international (indicatif puis groupes de chiffres)
 * @param region               code pays ISO (TG)
 * @param pays                 nom du pays en français
 * @param indicatif            indicatif pays (228)
 * @param type                 type de ligne (MOBILE, FIXED_LINE…)
 * @param operateur            opérateur d'origine du numéro (peut être vide si inconnu des métadonnées)
 */
public record NumeroAnalyse(
        PhoneNumber numero,
        String e164,
        String international,
        String region,
        String pays,
        int indicatif,
        PhoneNumberType type,
        String operateur
) {}
