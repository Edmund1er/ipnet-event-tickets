package tg.ipnetinstitute.technology.features.billet.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tg.ipnetinstitute.technology.features.billet.service.ServiceBillet;
import tg.ipnetinstitute.technology.features.billet.dto.response.BilletResponse;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/billets")
public class BilletController {

    private final ServiceBillet serviceBillet;

    public BilletController(ServiceBillet serviceBillet) {
        this.serviceBillet = serviceBillet;
    }

    @GetMapping("/moi")
    public ResponseEntity<List<BilletResponse>> mesBillets(@AuthenticationPrincipal Long utilisateurId) {
        return ResponseEntity.ok(serviceBillet.mesBillets(utilisateurId));
    }

    @GetMapping(value = "/{id}/qr", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getQrCode(
            @PathVariable UUID id,
            @AuthenticationPrincipal Long utilisateurId) {
        byte[] image = serviceBillet.imageQr(id, utilisateurId);
        return ResponseEntity.ok().cacheControl(org.springframework.http.CacheControl.noStore()).body(image);
    }

    @PostMapping("/{id}/renvoi")
    public ResponseEntity<java.util.Map<String, String>> renvoyer(@PathVariable UUID id,
                                                                  @AuthenticationPrincipal Long utilisateurId) {
        serviceBillet.renvoyer(id, utilisateurId);
        return ResponseEntity.ok(java.util.Map.of("message", "Le billet va vous être renvoyé par e-mail."));
    }
}
