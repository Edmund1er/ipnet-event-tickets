package tg.ipnetinstitute.technology.features.evenement.wrapper;

import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import tg.ipnetinstitute.technology.common.stockage.StockageSupabase;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

/**
 * Stockage des images d'événement (EF-10) hors du répertoire web, sous un nom aléatoire (UUID).
 * Le type est vérifié par inspection du contenu (JPEG, PNG, WebP) ; taille maximale 5 Mo.
 * Stockage : Supabase Storage quand il est configuré (les fichiers survivent aux redéploiements), sinon disque local.
 */
@Component
public class StockageImageWrapper {

    private static final long TAILLE_MAX = 5L * 1024 * 1024;
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", ".jpg", "image/png", ".png", "image/webp", ".webp");

    private final Path dossier;
    private static final String PREFIXE = "images/";
    private final Tika tika = new Tika();
    private final StockageSupabase distant;

    public StockageImageWrapper(@Value("${app.stockage.images.chemin:./uploads/images}") String chemin, StockageSupabase distant) {
        this.distant = distant;
        this.dossier = Paths.get(chemin).toAbsolutePath().normalize();
        if (distant.actif()) return;
        try {
            Files.createDirectories(dossier);
        } catch (IOException e) {
            throw new UncheckedIOException("Impossible d'initialiser le dossier des images", e);
        }
    }

    /** @return le nom de fichier stocké */
    public String enregistrer(byte[] contenu) {
        if (contenu == null || contenu.length == 0) {
            throw new IllegalArgumentException("Image vide");
        }
        if (contenu.length > TAILLE_MAX) {
            throw new IllegalArgumentException("L'image dépasse la taille maximale de 5 Mo");
        }
        String type = tika.detect(contenu);
        String extension = EXTENSIONS.get(type);
        if (extension == null) {
            throw new IllegalArgumentException("Format d'image non supporté (JPG, PNG ou WebP attendu)");
        }
        String nom = UUID.randomUUID() + extension;
        if (distant.actif()) {
            distant.enregistrer(PREFIXE + nom, contenu, type);
            return nom;
        }
        try {
            Files.write(dossier.resolve(nom), contenu);
        } catch (IOException e) {
            throw new UncheckedIOException("Échec de l'enregistrement de l'image", e);
        }
        return nom;
    }

    public Resource lire(String nom) {
        if (distant.actif()) {
            return new ByteArrayResource(distant.lire(PREFIXE + verifierNom(nom)));
        }
        Path fichier = resoudre(nom);
        if (!Files.isRegularFile(fichier)) {
            throw new IllegalStateException("Image introuvable sur le disque");
        }
        return new FileSystemResource(fichier);
    }

    public String typeMime(String nom) {
        return nom.endsWith(".png") ? "image/png" : nom.endsWith(".webp") ? "image/webp" : "image/jpeg";
    }

    public void supprimer(String nom) {
        if (nom == null) return;
        if (distant.actif()) {
            distant.supprimer(PREFIXE + verifierNom(nom));
            return;
        }
        try {
            Files.deleteIfExists(resoudre(nom));
        } catch (IOException ignored) {
            // un fichier orphelin n'empêche pas l'opération métier
        }
    }

    /** Nom généré par la plateforme (UUID + extension) : tout autre format est refusé. */
    private static String verifierNom(String nom) {
        if (nom == null || !nom.matches("[0-9a-fA-F-]{36}\\.(jpg|png|webp)")) {
            throw new IllegalArgumentException("Chemin d'image invalide");
        }
        return nom;
    }

    private Path resoudre(String nom) {
        Path p = dossier.resolve(nom).normalize();
        if (!p.startsWith(dossier)) {
            throw new IllegalArgumentException("Chemin d'image invalide");
        }
        return p;
    }
}
