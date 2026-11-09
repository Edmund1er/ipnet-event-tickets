package tg.ipnetinstitute.technology.common.validation.email;

import org.springframework.stereotype.Component;
import tg.ipnetinstitute.technology.common.exception.EmailInvalideException;

import java.util.List;
import java.util.Locale;

/**
 * Point d'entrée unique de validation des adresses (RG-01) : normalisation (minuscules, espaces retirés)
 * puis application de toutes les {@link RegleEmail} déclarées.
 */
@Component
public class ValidateurEmail {

    private final List<RegleEmail> regles;

    public ValidateurEmail(List<RegleEmail> regles) {
        this.regles = regles;
    }

    public String normaliser(String saisie) {
        if (saisie == null || saisie.isBlank()) {
            throw new EmailInvalideException("L'adresse e-mail est obligatoire.");
        }
        String adresse = saisie.trim().toLowerCase(Locale.ROOT);
        regles.forEach(r -> r.verifier(adresse));
        return adresse;
    }
}
