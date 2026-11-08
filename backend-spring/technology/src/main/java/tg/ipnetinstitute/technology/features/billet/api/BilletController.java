package tg.ipnetinstitute.technology.features.billet.api;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tg.ipnetinstitute.technology.features.billet.application.ServiceBillet;
import tg.ipnetinstitute.technology.features.billet.domaine.Billet;

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
    public ResponseEntity<List<Billet>> mesBillets(@AuthenticationPrincipal Long utilisateurId) {
        return ResponseEntity.ok(serviceBillet.mesBillets(utilisateurId));
    }

    @GetMapping(value = "/{id}/qr", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getQrCode(
            @PathVariable UUID id,
            @AuthenticationPrincipal Long utilisateurId) {
        byte[] image = serviceBillet.imageQr(id, utilisateurId);
        return ResponseEntity.ok(image);
    }
}
