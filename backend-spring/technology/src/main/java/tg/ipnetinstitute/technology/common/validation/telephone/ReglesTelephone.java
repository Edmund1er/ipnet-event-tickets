package tg.ipnetinstitute.technology.common.validation.telephone;

import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.PhoneNumberUtil.PhoneNumberType;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import tg.ipnetinstitute.technology.common.exception.TelephoneInvalideException;

import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Règles fournies par défaut. Toutes s'appuient sur les métadonnées officielles de libphonenumber
 * (plans de numérotation de chaque pays, dont le Togo) : aucun préfixe n'est codé en dur.
 */
@Configuration
public class ReglesTelephone {

    private static final PhoneNumberUtil UTIL = PhoneNumberUtil.getInstance();

    private static final Map<PhoneNumberType, String> LIBELLES = Map.of(
            PhoneNumberType.MOBILE, "mobile",
            PhoneNumberType.FIXED_LINE, "fixe",
            PhoneNumberType.FIXED_LINE_OR_MOBILE, "fixe ou mobile",
            PhoneNumberType.VOIP, "VoIP",
            PhoneNumberType.TOLL_FREE, "numéro vert",
            PhoneNumberType.PREMIUM_RATE, "numéro surtaxé");

    /** 1. Le numéro existe dans le plan de numérotation de son pays (longueur et tranches attribuées). */
    @Bean
    @Order(10)
    RegleTelephone regleNumeroAttribue() {
        return (n, usage) -> {
            if (!UTIL.isValidNumber(n.numero())) {
                throw new TelephoneInvalideException(
                        "Ce numéro n'existe pas dans le plan de numérotation " + prepositionPays(n.region()) + " (+" + n.indicatif() + ")"
                                + longueurAttendue(n.region()) + ".");
            }
        };
    }

    /** 2. Le pays du numéro fait partie des régions autorisées (configuration). */
    @Bean
    @Order(20)
    RegleTelephone regleRegionAutorisee(ProprietesTelephone proprietes) {
        return (n, usage) -> {
            var autorisees = proprietes.regionsAutorisees();
            if (!autorisees.isEmpty() && !autorisees.contains(n.region())) {
                String liste = autorisees.stream()
                        .map(r -> Locale.of("", r).getDisplayCountry(Locale.FRENCH) + " (+" + UTIL.getCountryCodeForRegion(r) + ")")
                        .collect(Collectors.joining(", "));
                throw new TelephoneInvalideException("Les numéros acceptés sont ceux de : " + liste + ".");
            }
        };
    }

    /** 3. Le type de ligne correspond à l'usage (ex. Mobile Money : ligne mobile uniquement). */
    @Bean
    @Order(30)
    RegleTelephone regleTypeLigne(ProprietesTelephone proprietes) {
        return (n, usage) -> {
            var acceptes = proprietes.types().get(usage);
            if (acceptes != null && !acceptes.contains(n.type())) {
                // « fixe ou mobile » est redondant quand « mobile » est déjà accepté
                String attendus = acceptes.stream()
                        .filter(t -> !(t == PhoneNumberType.FIXED_LINE_OR_MOBILE && acceptes.contains(PhoneNumberType.MOBILE)))
                        .map(t -> LIBELLES.getOrDefault(t, t.name())).distinct().sorted()
                        .collect(Collectors.joining(" ou "));
                throw new TelephoneInvalideException("Ce numéro est une ligne " + LIBELLES.getOrDefault(n.type(), "non reconnue")
                        + " : une ligne " + attendus + " est attendue.");
            }
        };
    }

    static String prepositionPays(String region) {
        String pays = Locale.of("", region).getDisplayCountry(Locale.FRENCH);
        return pays.isBlank() ? "du pays" : "de " + pays;
    }

    /** Longueur nationale tirée du numéro d'exemple des métadonnées (le numéro lui-même n'est jamais affiché). */
    static String longueurAttendue(String region) {
        var exemple = UTIL.getExampleNumberForType(region, PhoneNumberType.MOBILE);
        if (exemple == null) return "";
        int chiffres = UTIL.getNationalSignificantNumber(exemple).length();
        return " : " + chiffres + " chiffres sont attendus après l'indicatif";
    }
}
