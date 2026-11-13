package tg.ipnetinstitute.technology.features.evenement.service;

import org.springframework.stereotype.Component;
import tg.ipnetinstitute.technology.common.exception.RessourceIntrouvableException;
import tg.ipnetinstitute.technology.features.evenement.model.Evenement;
import tg.ipnetinstitute.technology.features.evenement.model.StatutEvenement;
import tg.ipnetinstitute.technology.features.evenement.repository.EvenementRepository;

/** Chargement d'un événement, partagé par les services (événements, programme). */
@Component
public class AccesEvenement {

    private final EvenementRepository evenements;

    public AccesEvenement(EvenementRepository evenements) {
        this.evenements = evenements;
    }

    public Evenement charger(Long id) {
        return evenements.findById(id).orElseThrow(() -> new RessourceIntrouvableException("Événement", id));
    }

    /** Chargement avec verrou, refusé pour un événement annulé ou terminé. */
    public Evenement chargerPourModification(Long id) {
        Evenement e = evenements.findByIdForUpdate(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Événement", id));
        if (e.getStatut() == StatutEvenement.ANNULE || e.getStatut() == StatutEvenement.TERMINE) {
            throw new IllegalStateException("Cet événement est "
                    + (e.getStatut() == StatutEvenement.ANNULE ? "annulé" : "terminé") + " : il ne peut plus être modifié");
        }
        return e;
    }
}
