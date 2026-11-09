package tg.ipnetinstitute.technology.common.validation.telephone;

/**
 * Usage d'un numéro : détermine les types de ligne acceptés (configurés dans app.telephone.types.*).
 * Ajouter un usage = ajouter une valeur ici et sa configuration, sans toucher aux règles.
 */
public enum UsageTelephone {
    /** Téléphone d'un compte (participant, agent, administrateur). */
    COMPTE,
    /** Numéro de réception des paiements Mobile Money : obligatoirement une ligne mobile. */
    MOBILE_MONEY
}
