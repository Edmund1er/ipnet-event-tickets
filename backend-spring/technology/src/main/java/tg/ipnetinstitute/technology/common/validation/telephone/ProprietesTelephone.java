package tg.ipnetinstitute.technology.common.validation.telephone;

import com.google.i18n.phonenumbers.PhoneNumberUtil.PhoneNumberType;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Politique de numérotation (application.properties, préfixe app.telephone) :
 * <pre>
 * app.telephone.region-par-defaut=TG
 * app.telephone.regions-autorisees=TG,BJ,GH     (vide = toutes les régions)
 * app.telephone.types.COMPTE=MOBILE,FIXED_LINE_OR_MOBILE
 * app.telephone.types.MOBILE_MONEY=MOBILE,FIXED_LINE_OR_MOBILE
 * </pre>
 */
@ConfigurationProperties(prefix = "app.telephone")
public record ProprietesTelephone(
        String regionParDefaut,
        List<String> regionsAutorisees,
        Map<UsageTelephone, Set<PhoneNumberType>> types
) {
    public ProprietesTelephone {
        regionParDefaut = regionParDefaut == null || regionParDefaut.isBlank() ? "TG" : regionParDefaut.trim().toUpperCase();
        regionsAutorisees = regionsAutorisees == null ? List.of()
                : regionsAutorisees.stream().map(String::trim).filter(s -> !s.isEmpty()).map(String::toUpperCase).toList();
        Map<UsageTelephone, Set<PhoneNumberType>> t = new EnumMap<>(UsageTelephone.class);
        t.put(UsageTelephone.COMPTE, Set.of(PhoneNumberType.MOBILE, PhoneNumberType.FIXED_LINE_OR_MOBILE, PhoneNumberType.FIXED_LINE));
        t.put(UsageTelephone.MOBILE_MONEY, Set.of(PhoneNumberType.MOBILE, PhoneNumberType.FIXED_LINE_OR_MOBILE));
        if (types != null) t.putAll(types);
        types = Map.copyOf(t);
    }
}
