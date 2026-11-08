package tg.ipnetinstitute.technology.features.reservation.application;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import tg.ipnetinstitute.technology.common.exception.UtilisateurNonAutoriseException;
import tg.ipnetinstitute.technology.features.evenement.domaine.Evenement;
import tg.ipnetinstitute.technology.features.identite.domaine.Utilisateur;

@Component
@Order(1)
public class RegleUtilisateurVerifie implements RegleReservation {

    @Override
    public void verifier(Utilisateur u, Evenement e) {
        if (!u.isTelephoneVerifie() || !u.isActif()) {
            throw new UtilisateurNonAutoriseException(u.getId());
        }
    }
}
