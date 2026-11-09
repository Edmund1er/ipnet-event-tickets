package tg.ipnetinstitute.technology.common.validation.telephone;

import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberToCarrierMapper;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.PhoneNumberUtil.PhoneNumberFormat;
import com.google.i18n.phonenumbers.Phonenumber.PhoneNumber;
import org.springframework.stereotype.Component;
import tg.ipnetinstitute.technology.common.exception.TelephoneInvalideException;

import java.util.List;
import java.util.Locale;

/**
 * Point d'entrée unique de validation des numéros (RG-02) :
 * analyse par libphonenumber (saisie internationale « +228… » ou nationale, région par défaut configurée),
 * puis application de toutes les {@link RegleTelephone} déclarées.
 */
@Component
public class ValidateurTelephone {

    private static final PhoneNumberUtil UTIL = PhoneNumberUtil.getInstance();
    private static final PhoneNumberToCarrierMapper OPERATEURS = PhoneNumberToCarrierMapper.getInstance();

    private final ProprietesTelephone proprietes;
    private final List<RegleTelephone> regles;

    public ValidateurTelephone(ProprietesTelephone proprietes, List<RegleTelephone> regles) {
        this.proprietes = proprietes;
        this.regles = regles;
    }

    /** Analyse et valide ; renvoie le numéro normalisé (E.164) et ses caractéristiques. */
    public NumeroAnalyse valider(String saisie, UsageTelephone usage) {
        NumeroAnalyse analyse = analyser(saisie);
        regles.forEach(r -> r.verifier(analyse, usage));
        return analyse;
    }

    /** Raccourci : numéro E.164 validé. */
    public String normaliser(String saisie, UsageTelephone usage) {
        return valider(saisie, usage).e164();
    }

    public String regionParDefaut() {
        return proprietes.regionParDefaut();
    }

    public List<String> regionsAutorisees() {
        return proprietes.regionsAutorisees();
    }

    private NumeroAnalyse analyser(String saisie) {
        if (saisie == null || saisie.isBlank()) {
            throw new TelephoneInvalideException("Le numéro de téléphone est obligatoire.");
        }
        PhoneNumber numero;
        try {
            numero = UTIL.parse(saisie.trim(), proprietes.regionParDefaut());
        } catch (NumberParseException e) {
            throw new TelephoneInvalideException("Numéro de téléphone illisible. Saisissez-le au format international, par exemple avec l'indicatif +"
                    + UTIL.getCountryCodeForRegion(proprietes.regionParDefaut()) + ".");
        }
        String region = UTIL.getRegionCodeForNumber(numero);
        if (region == null) {
            region = UTIL.getRegionCodeForCountryCode(numero.getCountryCode());
        }
        return new NumeroAnalyse(
                numero,
                UTIL.format(numero, PhoneNumberFormat.E164),
                UTIL.format(numero, PhoneNumberFormat.INTERNATIONAL),
                region,
                Locale.of("", region).getDisplayCountry(Locale.FRENCH),
                numero.getCountryCode(),
                UTIL.getNumberType(numero),
                OPERATEURS.getNameForNumber(numero, Locale.FRENCH)
        );
    }
}
