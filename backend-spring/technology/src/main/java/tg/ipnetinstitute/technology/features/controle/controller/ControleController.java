package tg.ipnetinstitute.technology.features.controle.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import tg.ipnetinstitute.technology.features.controle.dto.request.FormatExport;
import tg.ipnetinstitute.technology.features.controle.dto.request.ScanRequest;
import tg.ipnetinstitute.technology.features.controle.dto.response.ResultatScanResponse;
import tg.ipnetinstitute.technology.features.controle.dto.response.StatistiquesEvenement;
import tg.ipnetinstitute.technology.features.controle.model.ResultatScan;
import tg.ipnetinstitute.technology.features.controle.service.ServiceControle;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Contrôle d'accès (EF-40 à EF-45).
 * Flux SSE : GET /api/scan/evenements/{id}/flux?access_token=... (EventSource ne peut pas envoyer d'en-tête),
 * événement nommé "statistiques" contenant StatistiquesEvenement à chaque entrée acceptée.
 */
@RestController
@RequestMapping("/api")
public class ControleController {

    private static final long DUREE_FLUX_MS = 60 * 60 * 1000L; // 1 h, le client se reconnecte ensuite

    private final ServiceControle serviceControle;
    private final Map<Long, List<SseEmitter>> fluxEmitters = new ConcurrentHashMap<>();

    public ControleController(ServiceControle serviceControle) {
        this.serviceControle = serviceControle;
    }

    @PostMapping("/scan")
    public ResponseEntity<ResultatScanResponse> scanner(@Valid @RequestBody ScanRequest body,
                                                        @AuthenticationPrincipal Long agentId) {
        ResultatScan resultat;
        try {
            resultat = serviceControle.scanner(body.jeton().trim(), body.evenementId(), agentId);
        } catch (org.springframework.orm.ObjectOptimisticLockingFailureException concurrent) {
            // RG-11 / §5.4 : deux scans simultanés du même billet → le second est rejoué et voit "déjà utilisé"
            resultat = serviceControle.scanner(body.jeton().trim(), body.evenementId(), agentId);
        }
        if (resultat instanceof ResultatScan.Accepte) {
            notifierFluxSse(body.evenementId());
        }
        return ResponseEntity.ok(ResultatScanResponse.de(resultat));
    }

    @GetMapping("/scan/evenements/{id}/statistiques")
    public ResponseEntity<StatistiquesEvenement> statistiques(@PathVariable Long id) {
        return ResponseEntity.ok(serviceControle.obtenirStatistiques(id));
    }

    @GetMapping(value = "/scan/evenements/{id}/flux", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter fluxSse(@PathVariable Long id) {
        // Lecture initiale (vérifie aussi les droits via @PreAuthorize avant d'ouvrir le flux)
        StatistiquesEvenement initiales = serviceControle.obtenirStatistiques(id);

        SseEmitter emitter = new SseEmitter(DUREE_FLUX_MS);
        List<SseEmitter> abonnes = fluxEmitters.computeIfAbsent(id, k -> new CopyOnWriteArrayList<>());
        abonnes.add(emitter);
        Runnable retirer = () -> abonnes.remove(emitter);
        emitter.onCompletion(retirer);
        emitter.onTimeout(retirer);
        emitter.onError(e -> retirer.run());

        try {
            emitter.send(SseEmitter.event().name("statistiques").data(initiales, MediaType.APPLICATION_JSON));
        } catch (IOException e) {
            emitter.complete();
        }
        return emitter;
    }

    @GetMapping("/admin/evenements/{id}/export")
    public ResponseEntity<byte[]> exporter(@PathVariable Long id,
                                           @RequestParam(defaultValue = "CSV") FormatExport format) {
        byte[] donnees = serviceControle.exporterStatistiques(id, format);
        MediaType type = format == FormatExport.PDF ? MediaType.APPLICATION_PDF : new MediaType("text", "csv", java.nio.charset.StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"presences_evt_" + id + "." + format.name().toLowerCase() + "\"")
                .contentType(type)
                .body(donnees);
    }

    private void notifierFluxSse(Long evenementId) {
        List<SseEmitter> abonnes = fluxEmitters.get(evenementId);
        if (abonnes == null || abonnes.isEmpty()) return;

        StatistiquesEvenement stats = serviceControle.obtenirStatistiques(evenementId);
        for (SseEmitter emitter : abonnes) {
            try {
                emitter.send(SseEmitter.event().name("statistiques").data(stats, MediaType.APPLICATION_JSON));
            } catch (Exception e) {
                abonnes.remove(emitter);
                emitter.completeWithError(e);
            }
        }
    }
}
