package tg.ipnetinstitute.technology.features.reservation.service;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import tg.ipnetinstitute.technology.common.exception.UtilisateurNonAutoriseException;
import tg.ipnetinstitute.technology.features.evenement.model.Evenement;
import tg.ipnetinstitute.technology.features.identite.model.Utilisateur;

@Component
@Order(1)
public class RegleUtilisateurVerifie implements RegleReservation {

    @Override
    public void verifier(Utilisateur u, Evenement e) {
        if (!u.isEmailVerifie() || !u.isActif()) {
            throw new UtilisateurNonAutoriseException(u.getId());
        }
    }
}
