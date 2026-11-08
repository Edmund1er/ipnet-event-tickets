package tg.ipnetinstitute.technology.features.reservation.service;

import tg.ipnetinstitute.technology.features.evenement.model.Evenement;
import tg.ipnetinstitute.technology.features.identite.model.Utilisateur;

/**
 * Interface pour le patron Chain of Responsibility (Section 9.5).
 * Les règles de réservation s'exécutent par ordre avec @Order.
 */
public interface RegleReservation {
    void verifier(Utilisateur utilisateur, Evenement evenement);
}
