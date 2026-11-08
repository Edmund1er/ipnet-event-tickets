package tg.ipnetinstitute.technology.features.reservation.application;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import tg.ipnetinstitute.technology.common.exception.EvenementNonReservableException;
import tg.ipnetinstitute.technology.features.evenement.domaine.Evenement;
import tg.ipnetinstitute.technology.features.evenement.domaine.StatutEvenement;
import tg.ipnetinstitute.technology.features.identite.domaine.Utilisateur;

import java.time.LocalDateTime;

@Component
@Order(3)
public class RegleEvenementOuvert implements RegleReservation {

    @Override
    public void verifier(Utilisateur u, Evenement e) {
        if (e.getStatut() != StatutEvenement.PUBLIE || e.getDateDebut().isBefore(LocalDateTime.now())) {
            throw new EvenementNonReservableException(e.getId(), e.getStatut());
        }
    }
}
