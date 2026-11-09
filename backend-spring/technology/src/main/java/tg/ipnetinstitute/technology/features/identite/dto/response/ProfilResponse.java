package tg.ipnetinstitute.technology.features.identite.dto.response;

import tg.ipnetinstitute.technology.features.identite.model.Role;
import tg.ipnetinstitute.technology.features.identite.model.TypeProfil;

import java.time.LocalDateTime;

/**
 * Profil de l'utilisateur connecté (GET /api/profil/moi).
 * Les blocs etudiant / visiteur sont null selon le type de profil (ADMIN et SCANNER : les deux sont null).
 */
public record ProfilResponse(
        Long id,
        String email,
        boolean emailVerifie,
        String telephone,
        Role role,
        TypeProfil typeProfil,
        String nom,
        String prenom,
        LocalDateTime creeLe,
        ProfilEtudiantResponse etudiant,
        ProfilVisiteurResponse visiteur
) {
    public record ProfilEtudiantResponse(
            Long filiereId,
            String filiereLibelle,
            int anneeInscriptionL1,
            boolean filiereModifiable
    ) {}

    public record ProfilVisiteurResponse(
            Long categorieId,
            String categorieCode,
            String categorieLibelle,
            String organisation
    ) {}
}
