package tg.ipnetinstitute.technology.features.identite.service;
import tg.ipnetinstitute.technology.features.identite.dto.request.DemandeProfil;
import tg.ipnetinstitute.technology.features.identite.dto.response.ResumePersonne;

import tg.ipnetinstitute.technology.features.identite.model.TypeProfil;

/**
 * Patron Strategy pour la gestion des différents types de participants (OCP).
 * Ajouter un type = ajouter une implémentation sans modifier le code existant.
 */
public interface ProfilParticipant {
    TypeProfil type();
    void valider(DemandeProfil demande);
    void enregistrer(Long utilisateurId, DemandeProfil demande);
    ResumePersonne resumer(Long utilisateurId);
}
