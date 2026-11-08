package tg.ipnetinstitute.technology.features.controle.wrapper;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.io.IOException;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class SseWrapper {
    private final CopyOnWriteArrayList<SseEmitter> emetteurs = new CopyOnWriteArrayList<>();

    public SseEmitter creerEmetteur() {
        SseEmitter emetteur = new SseEmitter(180_000L);
        emetteurs.add(emetteur);
        emetteur.onCompletion(() -> emetteurs.remove(emetteur));
        emetteur.onTimeout(() -> emetteurs.remove(emetteur));
        return emetteur;
    }

    public void diffuser(Object evenement) {
        for (SseEmitter emetteur : emetteurs) {
            try {
                emetteur.send(evenement);
            } catch (IOException e) {
                emetteurs.remove(emetteur);
            }
        }
    }
}
