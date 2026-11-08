package tg.ipnetinstitute.technology.features.reservation.service;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import tg.ipnetinstitute.technology.common.exception.DejaInscritException;
import tg.ipnetinstitute.technology.features.evenement.model.Evenement;
import tg.ipnetinstitute.technology.features.identite.model.Utilisateur;
import tg.ipnetinstitute.technology.features.reservation.repository.InscriptionRepository;

@Component
@Order(2)
public class RegleUniciteReservation implements RegleReservation {

    private final InscriptionRepository inscriptions;

    public RegleUniciteReservation(InscriptionRepository inscriptions) {
        this.inscriptions = inscriptions;
    }

    @Override
    public void verifier(Utilisateur u, Evenement e) {
        if (inscriptions.existsByUtilisateurIdAndEvenementId(u.getId(), e.getId())) {
            throw new DejaInscritException(u.getId(), e.getId());
        }
    }
}
