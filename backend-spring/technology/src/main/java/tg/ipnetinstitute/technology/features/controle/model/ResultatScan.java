package tg.ipnetinstitute.technology.features.controle.model;

import java.time.LocalDateTime;

/**
 * Types scellés Java 21 pour les résultats de scan (Section 9.8).
 * Aucune exception pour les cas attendus (performances et contrôle de flux).
 */
public sealed interface ResultatScan
        permits ResultatScan.Accepte, ResultatScan.DejaUtilise, ResultatScan.Invalide, ResultatScan.MauvaisEvenement, ResultatScan.EvenementAnnule {

    record Accepte(String nom, String prenom, String adresse, LocalDateTime instant) implements ResultatScan {}
    record DejaUtilise(LocalDateTime premierScan) implements ResultatScan {}
    record Invalide() implements ResultatScan {}
    record MauvaisEvenement() implements ResultatScan {}
    record EvenementAnnule() implements ResultatScan {}
}
