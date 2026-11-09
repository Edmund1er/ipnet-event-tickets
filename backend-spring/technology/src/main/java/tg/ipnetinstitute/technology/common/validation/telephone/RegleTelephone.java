package tg.ipnetinstitute.technology.common.validation.telephone;

/**
 * Une règle de validation de numéro (Chain of Responsibility, ordre via @Order).
 * Ajouter une contrainte = ajouter un bean, sans modifier les règles existantes (OCP).
 */
public interface RegleTelephone {

    /** @throws tg.ipnetinstitute.technology.common.exception.TelephoneInvalideException si la règle n'est pas respectée */
    void verifier(NumeroAnalyse numero, UsageTelephone usage);
}
