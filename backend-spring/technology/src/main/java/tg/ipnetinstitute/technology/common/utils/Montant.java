package tg.ipnetinstitute.technology.common.utils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Currency;
import java.util.Objects;

/**
 * Somme d'argent avec devise figée (RG-17).
 * Immuable (Value Object).
 */
public record Montant(BigDecimal valeur, Currency devise) {

    public Montant {
        Objects.requireNonNull(valeur, "La valeur du montant est obligatoire");
        Objects.requireNonNull(devise, "La devise est obligatoire");
        if (valeur.signum() < 0) {
            throw new IllegalArgumentException("Le montant ne peut pas être négatif");
        }
        valeur = valeur.setScale(2, RoundingMode.HALF_EVEN);
    }

    public static Montant of(BigDecimal valeur, String codeDevise) {
        return new Montant(valeur, Currency.getInstance(codeDevise));
    }
}
