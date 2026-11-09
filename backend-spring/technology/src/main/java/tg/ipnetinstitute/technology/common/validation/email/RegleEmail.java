package tg.ipnetinstitute.technology.common.validation.email;

/**
 * Une règle de validation d'adresse e-mail (Chain of Responsibility, ordre via @Order).
 * Ajouter une contrainte (liste de domaines, domaines jetables…) = ajouter un bean.
 */
public interface RegleEmail {

    /** @param adresse adresse déjà normalisée (minuscules, sans espaces) */
    void verifier(String adresse);
}
