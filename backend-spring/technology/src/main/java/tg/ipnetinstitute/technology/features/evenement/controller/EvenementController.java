package tg.ipnetinstitute.technology.features.evenement.controller;

import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tg.ipnetinstitute.technology.common.response.PageResponse;
import tg.ipnetinstitute.technology.features.evenement.dto.request.DemandeEvenement;
import tg.ipnetinstitute.technology.features.evenement.dto.request.ModificationEvenement;
import tg.ipnetinstitute.technology.features.evenement.dto.response.EvenementResume;
import tg.ipnetinstitute.technology.features.evenement.model.StatutEvenement;
import tg.ipnetinstitute.technology.features.evenement.service.ServiceEvenement;
import tg.ipnetinstitute.technology.features.evenement.utils.FiltresEvenementUtils;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class EvenementController {

    private final ServiceEvenement serviceEvenement;

    public EvenementController(ServiceEvenement serviceEvenement) {
        this.serviceEvenement = serviceEvenement;
    }

    // ---------- Public ----------

    /** EF-13 : filtres titre, dateMin / dateMax (AAAA-MM-JJ), prixMin / prixMax, pagination. */
    @GetMapping("/evenements")
    public ResponseEntity<PageResponse<EvenementResume>> listerPublies(
            @RequestParam(required = false) String titre,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateMin,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateMax,
            @RequestParam(required = false) BigDecimal prixMin,
            @RequestParam(required = false) BigDecimal prixMax,
            @PageableDefault(size = 12, sort = "dateDebut", direction = Sort.Direction.ASC) Pageable pageable) {
        var filtre = new FiltresEvenementUtils.Filtre(titre, dateMin, dateMax, prixMin, prixMax);
        return ResponseEntity.ok(PageResponse.de(serviceEvenement.listerPublies(filtre, pageable)));
    }

    @GetMapping("/evenements/{id}")
    public ResponseEntity<EvenementResume> consulter(@PathVariable Long id) {
        return ResponseEntity.ok(serviceEvenement.consulterPublic(id));
    }

    @GetMapping("/evenements/{id}/image")
    public ResponseEntity<Resource> image(@PathVariable Long id) {
        var img = serviceEvenement.imagePublique(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(img.typeMime()))
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(10)).cachePublic())
                .body(img.contenu());
    }

    // ---------- Administration ----------

    @GetMapping("/admin/evenements")
    public ResponseEntity<PageResponse<EvenementResume>> listerAdmin(
            @RequestParam(required = false) StatutEvenement statut,
            @RequestParam(required = false) String titre,
            @PageableDefault(size = 20, sort = "dateDebut", direction = Sort.Direction.DESC) Pageable pageable) {
        var filtre = new FiltresEvenementUtils.Filtre(titre, null, null, null, null);
        return ResponseEntity.ok(PageResponse.de(serviceEvenement.listerAdmin(statut, filtre, pageable)));
    }

    @GetMapping("/admin/evenements/{id}")
    public ResponseEntity<EvenementResume> consulterAdmin(@PathVariable Long id) {
        return ResponseEntity.ok(serviceEvenement.consulter(id));
    }

    @GetMapping("/admin/evenements/{id}/image")
    public ResponseEntity<Resource> imageAdmin(@PathVariable Long id) {
        var img = serviceEvenement.imageAdmin(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(img.typeMime()))
                .cacheControl(CacheControl.noStore())
                .body(img.contenu());
    }

    @PostMapping("/admin/evenements")
    public ResponseEntity<EvenementResume> creer(@Valid @RequestBody DemandeEvenement demande,
                                                 @AuthenticationPrincipal Long adminId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(serviceEvenement.creer(demande, adminId));
    }

    @PutMapping("/admin/evenements/{id}")
    public ResponseEntity<EvenementResume> modifier(@PathVariable Long id,
                                                    @Valid @RequestBody ModificationEvenement demande,
                                                    @AuthenticationPrincipal Long adminId) {
        return ResponseEntity.ok(serviceEvenement.modifier(id, demande, adminId));
    }

    @PostMapping(value = "/admin/evenements/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<EvenementResume> definirImage(@PathVariable Long id,
                                                        @RequestParam("fichier") MultipartFile fichier) throws IOException {
        return ResponseEntity.ok(serviceEvenement.definirImage(id, fichier.getBytes()));
    }

    @DeleteMapping("/admin/evenements/{id}/image")
    public ResponseEntity<EvenementResume> supprimerImage(@PathVariable Long id) {
        return ResponseEntity.ok(serviceEvenement.supprimerImage(id));
    }

    @PostMapping("/admin/evenements/{id}/publication")
    public ResponseEntity<EvenementResume> publier(@PathVariable Long id, @AuthenticationPrincipal Long adminId) {
        return ResponseEntity.ok(serviceEvenement.publier(id, adminId));
    }

    @PostMapping("/admin/evenements/{id}/cloture")
    public ResponseEntity<EvenementResume> cloturer(@PathVariable Long id, @AuthenticationPrincipal Long adminId) {
        return ResponseEntity.ok(serviceEvenement.cloturer(id, adminId));
    }

    @PostMapping("/admin/evenements/{id}/annulation")
    public ResponseEntity<EvenementResume> annuler(@PathVariable Long id,
                                                   @RequestBody(required = false) Map<String, String> body,
                                                   @AuthenticationPrincipal Long adminId) {
        String motif = body != null ? body.getOrDefault("motif", "").trim() : "";
        if (motif.isEmpty()) {
            throw new IllegalArgumentException("Le motif d'annulation est obligatoire");
        }
        if (motif.length() > 255) {
            throw new IllegalArgumentException("Le motif d'annulation ne doit pas dépasser 255 caractères");
        }
        return ResponseEntity.ok(serviceEvenement.annuler(id, adminId, motif));
    }
}
