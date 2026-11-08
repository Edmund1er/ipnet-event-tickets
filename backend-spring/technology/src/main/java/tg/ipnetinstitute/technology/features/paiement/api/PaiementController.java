package tg.ipnetinstitute.technology.features.paiement.api;

import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tg.ipnetinstitute.technology.features.paiement.application.ServicePaiement;
import tg.ipnetinstitute.technology.features.paiement.application.StockagePreuve;
import tg.ipnetinstitute.technology.features.paiement.domaine.Paiement;
import tg.ipnetinstitute.technology.features.paiement.domaine.StatutPaiement;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class PaiementController {

    private final ServicePaiement servicePaiement;
    private final StockagePreuve stockagePreuve;

    public PaiementController(ServicePaiement servicePaiement, StockagePreuve stockagePreuve) {
        this.servicePaiement = servicePaiement;
        this.stockagePreuve = stockagePreuve;
    }

    @PostMapping(value = "/reservations/{id}/preuve", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> soumettrePreuve(
            @PathVariable Long id,
            @RequestParam("referenceOperateur") String referenceOperateur,
            @RequestParam(value = "fichier", required = false) MultipartFile fichier,
            @AuthenticationPrincipal Long utilisateurId) {
        servicePaiement.soumettrePreuve(id, utilisateurId, referenceOperateur, fichier);
        return ResponseEntity.ok(Map.of("message", "Preuve enregistrée avec succès."));
    }

    @GetMapping("/admin/paiements")
    public ResponseEntity<Page<Paiement>> listerPreuves(
            @RequestParam(defaultValue = "EN_ATTENTE") StatutPaiement statut,
            Pageable pageable) {
        return ResponseEntity.ok(servicePaiement.listerPreuves(statut, pageable));
    }

    @PostMapping("/admin/paiements/{id}/validation")
    public ResponseEntity<Map<String, String>> valider(
            @PathVariable Long id,
            @AuthenticationPrincipal Long adminId) {
        servicePaiement.valider(id, adminId);
        return ResponseEntity.ok(Map.of("message", "Paiement validé avec succès"));
    }

    @PostMapping("/admin/paiements/{id}/rejet")
    public ResponseEntity<Map<String, String>> rejeter(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal Long adminId) {
        String motif = body.getOrDefault("motif", "Preuve non conforme");
        servicePaiement.rejeter(id, adminId, motif);
        return ResponseEntity.ok(Map.of("message", "Paiement rejeté avec succès"));
    }

    @PostMapping(value = "/admin/paiements/releve", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> importerReleveCsv(@RequestParam("fichier") MultipartFile fichier) {
        int nbRapproches = servicePaiement.importerReleveCsv(fichier);
        return ResponseEntity.ok(Map.of(
                "message", "Relevé importé avec succès",
                "nombreRapprochesAutomatiquement", nbRapproches
        ));
    }

    @GetMapping("/admin/paiements/fichiers/{chemin}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Resource> telechargerFichierPreuve(@PathVariable String chemin) {
        Resource res = stockagePreuve.lire(chemin);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + chemin + "\"")
                .body(res);
    }
}
