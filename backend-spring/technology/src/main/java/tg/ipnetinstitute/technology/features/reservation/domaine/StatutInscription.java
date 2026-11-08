package tg.ipnetinstitute.technology.features.reservation.domaine;

/**
 * State Pattern pour StatutInscription avec transitions immuables (Section 9.5).
 */
public enum StatutInscription {
    EN_ATTENTE_PAIEMENT,
    PREUVE_ENVOYEE,
    REJETEE,
    CONFIRMEE,
    ANNULEE,
    EXPIREE;

    public boolean peutPasserA(StatutInscription cible) {
        return switch (this) {
            case EN_ATTENTE_PAIEMENT -> cible == PREUVE_ENVOYEE || cible == ANNULEE || cible == EXPIREE;
            case PREUVE_ENVOYEE -> cible == CONFIRMEE || cible == REJETEE || cible == ANNULEE;
            case REJETEE -> cible == PREUVE_ENVOYEE || cible == ANNULEE || cible == EXPIREE;
            case CONFIRMEE, ANNULEE, EXPIREE -> false;
        };
    }
}
