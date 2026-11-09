package tg.ipnetinstitute.technology.features.identite.dto.response;

import tg.ipnetinstitute.technology.features.identite.model.TypeProfil;
import tg.ipnetinstitute.technology.features.reservation.model.StatutInscription;

import java.time.LocalDateTime;

/** EF-50 : participant d'un événement avec le statut de sa réservation. */
public record ParticipantResponse(
        Long inscriptionId,
        Long utilisateurId,
        String nom,
        String prenom,
        String email,
        String telephone,
        TypeProfil typeProfil,
        StatutInscription statut,
        LocalDateTime reserveLe
) {}
