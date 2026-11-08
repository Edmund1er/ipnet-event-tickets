package tg.ipnetinstitute.technology.features.identite.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tg.ipnetinstitute.technology.features.identite.service.ServiceProfilEtudiant;

import java.util.Map;

@RestController
@RequestMapping("/api/profil")
public class ProfilController {

    private final ServiceProfilEtudiant serviceProfilEtudiant;

    public ProfilController(ServiceProfilEtudiant serviceProfilEtudiant) {
        this.serviceProfilEtudiant = serviceProfilEtudiant;
    }

    @PostMapping("/etudiant/filiere")
    public ResponseEntity<Map<String, String>> changerFiliere(
            @RequestBody Map<String, Long> body,
            @AuthenticationPrincipal Long utilisateurId) {
        Long nouvelleFiliereId = body.get("nouvelleFiliereId");
        serviceProfilEtudiant.changerFiliere(utilisateurId, nouvelleFiliereId);
        return ResponseEntity.ok(Map.of("message", "Filière modifiée avec succès"));
    }
}
