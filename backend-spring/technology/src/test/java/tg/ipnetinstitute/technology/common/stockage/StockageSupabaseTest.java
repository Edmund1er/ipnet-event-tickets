package tg.ipnetinstitute.technology.common.stockage;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import tg.ipnetinstitute.technology.features.evenement.wrapper.StockageImageWrapper;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Faux serveur Supabase Storage : vérifie le protocole (clé, chemin, méthodes) sans réseau ni compte. */
class StockageSupabaseTest {

    private static final byte[] PNG = Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==");

    private HttpServer serveur;
    private final Map<String, byte[]> fichiers = new ConcurrentHashMap<>();
    private final List<String> appels = new ArrayList<>();
    private String url;

    @BeforeEach
    void demarrer() throws IOException {
        serveur = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        serveur.createContext("/storage/v1", ex -> {
            String chemin = ex.getRequestURI().getPath().substring("/storage/v1".length());
            appels.add(ex.getRequestMethod() + " " + chemin + " auth=" + ex.getRequestHeaders().getFirst("Authorization"));
            byte[] corps = ex.getRequestBody().readAllBytes();
            int code = 200;
            byte[] reponse = new byte[0];
            if (chemin.equals("/bucket")) {
                code = 200;
            } else if ("PUT".equals(ex.getRequestMethod())) {
                fichiers.put(chemin, corps);
            } else if ("GET".equals(ex.getRequestMethod())) {
                reponse = fichiers.get(chemin);
                if (reponse == null) { code = 404; reponse = new byte[0]; }
            } else if ("DELETE".equals(ex.getRequestMethod())) {
                fichiers.remove(chemin);
            }
            ex.sendResponseHeaders(code, reponse.length == 0 ? -1 : reponse.length);
            if (reponse.length > 0) ex.getResponseBody().write(reponse);
            ex.close();
        });
        serveur.start();
        url = "http://127.0.0.1:" + serveur.getAddress().getPort();
    }

    @AfterEach
    void arreter() {
        serveur.stop(0);
    }

    @Test
    void imageEnvoyeeLueEtSupprimeeViaSupabase() throws IOException {
        var distant = new StockageSupabase(url, "cle-secrete", "ipnet-fichiers");
        assertThat(distant.actif()).isTrue();
        var wrapper = new StockageImageWrapper("./uploads/test-inutilise", distant);

        String nom = wrapper.enregistrer(PNG);
        assertThat(nom).endsWith(".png");
        assertThat(fichiers).containsKey("/object/ipnet-fichiers/images/" + nom);
        assertThat(appels).anyMatch(a -> a.contains("auth=Bearer cle-secrete"));

        assertThat(wrapper.lire(nom).getContentAsByteArray()).isEqualTo(PNG);

        wrapper.supprimer(nom);
        assertThat(fichiers).isEmpty();
    }

    @Test
    void nomDeFichierDetourne_refuse() {
        var wrapper = new StockageImageWrapper("./uploads/test-inutilise", new StockageSupabase(url, "cle", "b"));
        assertThatThrownBy(() -> wrapper.lire("../../autre.png")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void sansConfiguration_retombeSurLeDisqueLocal() {
        var distant = new StockageSupabase("", "", "b");
        assertThat(distant.actif()).isFalse();
    }
}
