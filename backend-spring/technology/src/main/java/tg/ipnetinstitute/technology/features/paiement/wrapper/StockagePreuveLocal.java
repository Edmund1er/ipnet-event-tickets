package tg.ipnetinstitute.technology.features.paiement.wrapper;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import tg.ipnetinstitute.technology.common.stockage.StockageSupabase;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Stockage local sécurisé des preuves :
 * Stocké HORS du répertoire web public (Section 5.2 OWASP), sous un nom aléatoire (UUID).
 * Supabase Storage quand il est configuré (les preuves survivent aux redéploiements), sinon disque local.
 */
@Component
public class StockagePreuveLocal implements StockagePreuveWrapper {

    private static final String PREFIXE = "preuves/";
    private final Path dossierRacine;
    private final StockageSupabase distant;

    public StockagePreuveLocal(@Value("${app.stockage.preuves.chemin:./uploads/preuves}") String chemin, StockageSupabase distant) {
        this.distant = distant;
        this.dossierRacine = Paths.get(chemin).toAbsolutePath().normalize();
        if (distant.actif()) return;
        try {
            Files.createDirectories(this.dossierRacine);
        } catch (IOException e) {
            throw new RuntimeException("Impossible d'initialiser le dossier de stockage des preuves", e);
        }
    }

    @Override
    public String enregistrer(InputStream contenu, String nomOriginal, String typeMime) {
        String extension = nomOriginal != null && nomOriginal.contains(".") 
                ? nomOriginal.substring(nomOriginal.lastIndexOf(".")) 
                : ".bin";
        String nomFichier = UUID.randomUUID() + extension;
        Path cheminCible = this.dossierRacine.resolve(nomFichier);

        if (distant.actif()) {
            try {
                distant.enregistrer(PREFIXE + nomFichier, contenu.readAllBytes(), typeMime);
                return nomFichier;
            } catch (IOException e) {
                throw new RuntimeException("Échec de l'enregistrement du fichier de preuve", e);
            }
        }
        try {
            Files.copy(contenu, cheminCible, StandardCopyOption.REPLACE_EXISTING);
            return nomFichier;
        } catch (IOException e) {
            throw new RuntimeException("Échec de l'enregistrement du fichier de preuve", e);
        }
    }

    @Override
    public Resource lire(String chemin) {
        if (distant.actif()) {
            if (!chemin.matches("[0-9a-fA-F-]{36}\\.[A-Za-z0-9]{1,8}")) {
                throw new IllegalArgumentException("Fichier de preuve introuvable : " + chemin);
            }
            return new ByteArrayResource(distant.lire(PREFIXE + chemin));
        }
        Path cheminFichier = this.dossierRacine.resolve(chemin).normalize();
        File file = cheminFichier.toFile();
        if (!file.exists()) {
            throw new IllegalArgumentException("Fichier de preuve introuvable : " + chemin);
        }
        return new FileSystemResource(file);
    }
}
