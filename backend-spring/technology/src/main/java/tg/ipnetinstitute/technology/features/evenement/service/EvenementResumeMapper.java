package tg.ipnetinstitute.technology.features.evenement.service;

import org.springframework.stereotype.Component;
import tg.ipnetinstitute.technology.features.evenement.dto.response.EvenementResume;
import tg.ipnetinstitute.technology.features.evenement.model.Evenement;

import java.time.LocalDateTime;

/** Transformation d'un événement en réponse d'API : un seul endroit à modifier quand le contrat évolue. */
@Component
public class EvenementResumeMapper {

    public EvenementResume resume(Evenement e) {
        LocalDateTime maintenant = LocalDateTime.now();
        return new EvenementResume(
                e.getId(),
                e.getTitre(),
                e.getDescription(),
                e.getDateDebut(),
                e.getLieu(),
                e.getPrix(),
                e.getDevise(),
                e.getCapacite(),
                e.getPlacesReservees(),
                e.getStatut(),
                e.getImageChemin() != null,
                e.getDateLimiteReservation(),
                e.isVentesSuspendues(),
                e.ventesOuvertes(maintenant),
                e.getAmbiance(),
                e.getCouleurPrincipale(),
                e.getType(),
                e.getParentId(),
                e.getDateFin(),
                e.getCategorie(),
                e.isAccesLibre(),
                e.getPassPortee(),
                e.getPassJour(),
                e.estPasse(maintenant),
                e.isMasque()
        );
    }
}
