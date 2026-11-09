package tg.ipnetinstitute.technology.features.identite.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tg.ipnetinstitute.technology.features.identite.dto.request.ChangementFiliereRequest;
import tg.ipnetinstitute.technology.features.identite.dto.request.ModificationProfilRequest;
import tg.ipnetinstitute.technology.features.identite.dto.request.SuppressionCompteRequest;
import tg.ipnetinstitute.technology.features.identite.dto.response.ProfilResponse;
import tg.ipnetinstitute.technology.features.identite.service.ServiceIdentite;
import tg.ipnetinstitute.technology.features.identite.service.ServiceProfilEtudiant;

import java.util.Map;

/**
 * Profil de l'utilisateur connecté (EF-08, EF-09, suppression de compte §5.2).
 */
@RestController
@RequestMapping("/api/profil")
public class ProfilController {

    private final ServiceProfilEtudiant serviceProfilEtudiant;
    private final ServiceIdentite serviceIdentite;
    private final tg.ipnetinstitute.technology.features.identite.service.ServiceVerificationEmail serviceVerificationEmail;

    public ProfilController(ServiceProfilEtudiant serviceProfilEtudiant, ServiceIdentite serviceIdentite,
                            tg.ipnetinstitute.technology.features.identite.service.ServiceVerificationEmail serviceVerificationEmail) {
        this.serviceProfilEtudiant = serviceProfilEtudiant;
        this.serviceIdentite = serviceIdentite;
        this.serviceVerificationEmail = serviceVerificationEmail;
    }

    /** EF-08 : changement d'adresse — étape 1, un code est envoyé à la nouvelle adresse. */
    @PostMapping("/moi/email")
    public ResponseEntity<Map<String, String>> demanderChangementEmail(@AuthenticationPrincipal Long utilisateurId,
                                                                       @Valid @RequestBody tg.ipnetinstitute.technology.features.identite.dto.request.ChangementEmailRequest body) {
        serviceVerificationEmail.demanderChangement(utilisateurId, body.nouvelEmail());
        return ResponseEntity.ok(Map.of("message", "Un code de confirmation a été envoyé à la nouvelle adresse."));
    }

    /** EF-08 : changement d'adresse — étape 2, confirmation avec le code reçu. */
    @PostMapping("/moi/email/confirmation")
    public ResponseEntity<ProfilResponse> confirmerChangementEmail(@AuthenticationPrincipal Long utilisateurId,
                                                                   @Valid @RequestBody tg.ipnetinstitute.technology.features.identite.dto.request.VerificationOtpRequest body) {
        serviceVerificationEmail.confirmerChangement(utilisateurId, body.code());
        return ResponseEntity.ok(serviceIdentite.profil(utilisateurId));
    }

    @GetMapping("/moi")
    public ResponseEntity<ProfilResponse> monProfil(@AuthenticationPrincipal Long utilisateurId) {
        return ResponseEntity.ok(serviceIdentite.profil(utilisateurId));
    }

    @PutMapping("/moi")
    public ResponseEntity<ProfilResponse> modifier(@AuthenticationPrincipal Long utilisateurId,
                                                   @Valid @RequestBody ModificationProfilRequest demande) {
        return ResponseEntity.ok(serviceIdentite.modifierProfil(utilisateurId, demande));
    }

    @DeleteMapping("/moi")
    public ResponseEntity<Void> supprimer(@AuthenticationPrincipal Long utilisateurId,
                                          @Valid @RequestBody SuppressionCompteRequest demande) {
        serviceIdentite.supprimerCompte(utilisateurId, demande.motDePasse());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/etudiant/filiere")
    public ResponseEntity<Map<String, String>> changerFiliere(@Valid @RequestBody ChangementFiliereRequest body,
                                                              @AuthenticationPrincipal Long utilisateurId) {
        serviceProfilEtudiant.changerFiliere(utilisateurId, body.nouvelleFiliereId());
        return ResponseEntity.ok(Map.of("message", "Filière modifiée avec succès"));
    }
}
