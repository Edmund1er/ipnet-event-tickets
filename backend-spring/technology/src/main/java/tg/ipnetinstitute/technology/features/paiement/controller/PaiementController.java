package tg.ipnetinstitute.technology.features.paiement.controller;

import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tg.ipnetinstitute.technology.common.response.PageResponse;
import tg.ipnetinstitute.technology.features.paiement.dto.request.RejetPaiementRequest;
import tg.ipnetinstitute.technology.features.paiement.dto.response.PaiementAdminResponse;
import tg.ipnetinstitute.technology.features.paiement.dto.response.RapportRapprochementResponse;
import tg.ipnetinstitute.technology.features.paiement.model.StatutPaiement;
import tg.ipnetinstitute.technology.features.paiement.service.ServicePaiement;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class PaiementController {

    private final ServicePaiement servicePaiement;

    public PaiementController(ServicePaiement servicePaiement) {
        this.servicePaiement = servicePaiement;
    }

    /** EF-21 : multipart avec referenceOperateur (obligatoire) et fichier (facultatif). */
    @PostMapping(value = "/reservations/{id}/preuve", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> soumettrePreuve(
            @PathVariable Long id,
            @RequestParam("referenceOperateur") String referenceOperateur,
            @RequestParam(value = "fichier", required = false) MultipartFile fichier,
            @AuthenticationPrincipal Long utilisateurId) {
        servicePaiement.soumettrePreuve(id, utilisateurId, referenceOperateur, fichier);
        return ResponseEntity.ok(Map.of("message", "Référence de paiement enregistrée."));
    }

    @GetMapping("/admin/paiements")
    public ResponseEntity<PageResponse<PaiementAdminResponse>> listerPreuves(
            @RequestParam(defaultValue = "EN_ATTENTE") StatutPaiement statut,
            @PageableDefault(size = 20, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(PageResponse.de(servicePaiement.listerPreuves(statut, pageable)));
    }

    @PostMapping("/admin/paiements/{id}/validation")
    public ResponseEntity<Map<String, String>> valider(@PathVariable Long id,
                                                       @AuthenticationPrincipal Long adminId) {
        servicePaiement.valider(id, adminId);
        return ResponseEntity.ok(Map.of("message", "Paiement validé avec succès"));
    }

    @PostMapping("/admin/paiements/{id}/rejet")
    public ResponseEntity<Map<String, String>> rejeter(@PathVariable Long id,
                                                       @Valid @RequestBody RejetPaiementRequest body,
                                                       @AuthenticationPrincipal Long adminId) {
        servicePaiement.rejeter(id, adminId, body.motif());
        return ResponseEntity.ok(Map.of("message", "Paiement rejeté avec succès"));
    }

    @PostMapping("/admin/paiements/{id}/remboursement")
    public ResponseEntity<Map<String, String>> marquerRembourse(@PathVariable Long id,
                                                                @AuthenticationPrincipal Long adminId) {
        servicePaiement.marquerRembourse(id, adminId);
        return ResponseEntity.ok(Map.of("message", "Paiement marqué comme remboursé"));
    }

    @PostMapping(value = "/admin/paiements/releve", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RapportRapprochementResponse> importerReleveCsv(@RequestParam("fichier") MultipartFile fichier) {
        return ResponseEntity.ok(servicePaiement.importerReleveCsv(fichier));
    }

    /** Capture jointe au paiement, servie uniquement à l'administrateur (§5.2). */
    @GetMapping("/admin/paiements/{id}/preuve")
    public ResponseEntity<Resource> telechargerPreuve(@PathVariable Long id) {
        ServicePaiement.FichierPreuve preuve = servicePaiement.lirePreuve(id);
        return ResponseEntity.ok()
                .contentType(preuve.type())
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + preuve.nom() + "\"")
                .body(preuve.contenu());
    }
}
