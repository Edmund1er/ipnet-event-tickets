package tg.ipnetinstitute.technology.common.stockage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Client minimal de Supabase Storage (API REST), pour conserver images et preuves hors du disque du serveur.
 * Le disque d'un hébergement gratuit est effacé à chaque redéploiement : sans ce stockage, les fichiers disparaissent.
 *
 * Inactif tant que SUPABASE_URL et SUPABASE_SERVICE_KEY ne sont pas définis : les wrappers retombent alors sur le disque local.
 * Le bucket est privé : les fichiers ne sont jamais servis directement, toujours par l'API après contrôle d'accès.
 */
@Component
public class StockageSupabase {

    private static final Logger log = LoggerFactory.getLogger(StockageSupabase.class);

    private final String urlBase;
    private final String cle;
    private final String bucket;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private volatile boolean bucketVerifie = false;

    public StockageSupabase(@Value("${app.stockage.supabase.url:}") String url,
                            @Value("${app.stockage.supabase.cle:}") String cle,
                            @Value("${app.stockage.supabase.bucket:ipnet-fichiers}") String bucket) {
        this.urlBase = url == null ? "" : url.replaceAll("/+$", "");
        this.cle = cle == null ? "" : cle.trim();
        this.bucket = bucket;
        if (actif()) {
            log.info("Stockage des fichiers : Supabase Storage (bucket « {} »)", bucket);
        } else {
            log.warn("Stockage des fichiers : disque local (SUPABASE_URL / SUPABASE_SERVICE_KEY absents). "
                    + "Sur un hébergement gratuit, ces fichiers sont perdus à chaque redéploiement.");
        }
    }

    public boolean actif() {
        return !urlBase.isBlank() && !cle.isBlank();
    }

    public void enregistrer(String chemin, byte[] contenu, String typeMime) {
        assurerBucket();
        var req = requete("/object/" + bucket + "/" + chemin)
                .header("Content-Type", typeMime == null ? "application/octet-stream" : typeMime)
                .header("x-upsert", "true")
                .PUT(HttpRequest.BodyPublishers.ofByteArray(contenu))
                .build();
        var rep = envoyer(req);
        if (rep.statusCode() / 100 != 2) {
            throw new IllegalStateException("Échec de l'envoi du fichier vers le stockage (HTTP " + rep.statusCode() + ")");
        }
    }

    public byte[] lire(String chemin) {
        var req = requete("/object/" + bucket + "/" + chemin).GET().build();
        try {
            var rep = http.send(req, HttpResponse.BodyHandlers.ofByteArray());
            if (rep.statusCode() == 404 || rep.statusCode() == 400) {
                throw new IllegalStateException("Fichier introuvable dans le stockage");
            }
            if (rep.statusCode() / 100 != 2) {
                throw new IllegalStateException("Lecture du stockage impossible (HTTP " + rep.statusCode() + ")");
            }
            return rep.body();
        } catch (IOException e) {
            throw new IllegalStateException("Stockage indisponible", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Lecture interrompue", e);
        }
    }

    public void supprimer(String chemin) {
        try {
            envoyer(requete("/object/" + bucket + "/" + chemin).DELETE().build());
        } catch (RuntimeException e) {
            log.warn("Suppression du fichier {} impossible : {}", chemin, e.getMessage()); // un fichier orphelin est sans gravité
        }
    }

    /** Crée le bucket privé s'il n'existe pas encore (une seule tentative par démarrage). */
    private void assurerBucket() {
        if (bucketVerifie) return;
        var req = requete("/bucket")
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{\"id\":\"" + bucket + "\",\"name\":\"" + bucket + "\",\"public\":false}"))
                .build();
        try {
            var rep = http.send(req, HttpResponse.BodyHandlers.ofString());
            // 200 créé ; 400/409 déjà existant : dans les deux cas le bucket est prêt
            bucketVerifie = true;
            if (rep.statusCode() == 401 || rep.statusCode() == 403) {
                bucketVerifie = false;
                log.error("Supabase Storage refuse la clé fournie (HTTP {}) : vérifiez SUPABASE_SERVICE_KEY", rep.statusCode());
            }
        } catch (IOException e) {
            log.warn("Vérification du bucket impossible : {}", e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private HttpRequest.Builder requete(String suffixe) {
        return HttpRequest.newBuilder(URI.create(urlBase + "/storage/v1" + suffixe))
                .timeout(Duration.ofSeconds(30))
                .header("Authorization", "Bearer " + cle)
                .header("apikey", cle);
    }

    private HttpResponse<String> envoyer(HttpRequest req) {
        try {
            return http.send(req, HttpResponse.BodyHandlers.ofString());
        } catch (IOException e) {
            throw new IllegalStateException("Stockage indisponible", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Envoi interrompu", e);
        }
    }
}
