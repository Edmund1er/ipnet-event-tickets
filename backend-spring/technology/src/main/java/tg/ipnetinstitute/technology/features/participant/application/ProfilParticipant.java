package tg.ipnetinstitute.technology.features.participant.application;

import tg.ipnetinstitute.technology.features.participant.domaine.TypeProfil;

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
