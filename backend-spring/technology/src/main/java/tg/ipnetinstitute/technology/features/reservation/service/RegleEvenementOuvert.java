package tg.ipnetinstitute.technology.features.reservation.service;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import tg.ipnetinstitute.technology.common.exception.EvenementNonReservableException;
import tg.ipnetinstitute.technology.features.evenement.model.Evenement;
import tg.ipnetinstitute.technology.features.evenement.model.StatutEvenement;
import tg.ipnetinstitute.technology.features.identite.model.Utilisateur;

import java.time.LocalDateTime;

@Component
@Order(3)
public class RegleEvenementOuvert implements RegleReservation {

    @Override
    public void verifier(Utilisateur u, Evenement e) {
        if (e.getStatut() != StatutEvenement.PUBLIE || e.finDeVente().isBefore(LocalDateTime.now()) || !e.estReservable()) {
            throw new EvenementNonReservableException(e.getId(), e.getStatut());
        }
        if (e.isVentesSuspendues()) {
            throw new tg.ipnetinstitute.technology.common.exception.VentesFermeesException(true);
        }
        if (e.getDateLimiteReservation() != null && e.getDateLimiteReservation().isBefore(LocalDateTime.now())) {
            throw new tg.ipnetinstitute.technology.common.exception.VentesFermeesException(false);
        }
    }
}
