package tg.ipnetinstitute.technology.features.controle.api;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import tg.ipnetinstitute.technology.features.controle.application.FormatExport;
import tg.ipnetinstitute.technology.features.controle.application.ServiceControle;
import tg.ipnetinstitute.technology.features.controle.application.StatistiquesEvenement;
import tg.ipnetinstitute.technology.features.controle.domaine.ResultatScan;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api")
public class ControleController {

    private final ServiceControle serviceControle;
    private final Map<Long, CopyOnWriteArrayList<SseEmitter>> fluxEmitters = new ConcurrentHashMap<>();

    public ControleController(ServiceControle serviceControle) {
        this.serviceControle = serviceControle;
    }

    @PostMapping("/scan")
    public ResponseEntity<ResultatScan> scanner(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal Long agentId) {
        String jeton = (String) body.get("jeton");
        Long evenementId = Long.valueOf(body.get("evenementId").toString());

        ResultatScan resultat = serviceControle.scanner(jeton, evenementId, agentId);

        // Notification push vers le flux SSE si le scan est accepté
        if (resultat instanceof ResultatScan.Accepte) {
            notifierFluxSse(evenementId);
        }

        return ResponseEntity.ok(resultat);
    }

    @GetMapping("/scan/evenements/{id}/statistiques")
    public ResponseEntity<StatistiquesEvenement> statistiques(@PathVariable Long id) {
        return ResponseEntity.ok(serviceControle.obtenirStatistiques(id));
    }

    @GetMapping(value = "/scan/evenements/{id}/flux", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter fluxSse(@PathVariable Long id) {
        SseEmitter emitter = new SseEmitter(60 * 60 * 1000L); // 1h
        fluxEmitters.computeIfAbsent(id, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> fluxEmitters.get(id).remove(emitter));
        emitter.onTimeout(() -> fluxEmitters.get(id).remove(emitter));

        try {
            emitter.send(serviceControle.obtenirStatistiques(id));
        } catch (IOException e) {
            emitter.complete();
        }

        return emitter;
    }

    @GetMapping("/admin/evenements/{id}/export")
    public ResponseEntity<byte[]> exporter(
            @PathVariable Long id,
            @RequestParam(defaultValue = "CSV") FormatExport format) {
        byte[] donnees = serviceControle.exporterStatistiques(id, format);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"presences_evt_" + id + "." + format.name().toLowerCase() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(donnees);
    }

    private void notifierFluxSse(Long evenementId) {
        var list = fluxEmitters.get(evenementId);
        if (list != null && !list.isEmpty()) {
            StatistiquesEvenement stats = serviceControle.obtenirStatistiques(evenementId);
            for (SseEmitter emitter : list) {
                try {
                    emitter.send(stats);
                } catch (Exception e) {
                    emitter.complete();
                    list.remove(emitter);
                }
            }
        }
    }
}
