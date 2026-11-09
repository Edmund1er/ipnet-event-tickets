package tg.ipnetinstitute.technology.common.exception;

import org.springframework.http.HttpStatus;

/** EF-07 : les réservations ouvrent dès que l'administrateur a renseigné le numéro Mobile Money. */
public class PaiementNonConfigureException extends MetierException {
    public PaiementNonConfigureException() {
        super("Les réservations ouvriront dès que l'administration aura renseigné le numéro de paiement Mobile Money.",
                HttpStatus.SERVICE_UNAVAILABLE, "PAIEMENT_NON_CONFIGURE");
    }
}
