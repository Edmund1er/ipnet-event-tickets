package tg.ipnetinstitute.technology.features.evenement.controller;

import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tg.ipnetinstitute.technology.features.evenement.dto.PageEvenement;
import tg.ipnetinstitute.technology.features.evenement.service.ServicePageEvenement;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;

/** Contenu de la page d'un événement : lecture publique, édition et images réservées à l'administrateur. */
@RestController
@RequestMapping("/api")
public class PageEvenementController {

    private final ServicePageEvenement service;

    public PageEvenementController(ServicePageEvenement service) {
        this.service = service;
    }

    @GetMapping("/evenements/{id}/page")
    public PageEvenement lire(@PathVariable Long id) {
        return service.lire(id, false);
    }

    @GetMapping("/evenements/{id}/page/images/{nom}")
    public ResponseEntity<Resource> image(@PathVariable Long id, @PathVariable String nom) {
        var img = service.image(id, nom, false);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(img.typeMime()))
                .cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePublic())
                .body(img.contenu());
    }

    @GetMapping("/admin/evenements/{id}/page")
    public PageEvenement lireAdmin(@PathVariable Long id) {
        return service.lire(id, true);
    }

    @GetMapping("/admin/evenements/{id}/page/images/{nom}")
    public ResponseEntity<Resource> imageAdmin(@PathVariable Long id, @PathVariable String nom) {
        var img = service.image(id, nom, true);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(img.typeMime())).cacheControl(CacheControl.noStore()).body(img.contenu());
    }

    @PutMapping("/admin/evenements/{id}/page")
    public PageEvenement enregistrer(@PathVariable Long id, @RequestBody PageEvenement page, @AuthenticationPrincipal Long adminId) {
        return service.enregistrer(id, page, adminId);
    }

    @PostMapping(value = "/admin/evenements/{id}/page/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> ajouterImage(@PathVariable Long id, @RequestParam("fichier") MultipartFile fichier) throws IOException {
        return Map.of("nom", service.ajouterImage(id, fichier.getBytes()));
    }
}
