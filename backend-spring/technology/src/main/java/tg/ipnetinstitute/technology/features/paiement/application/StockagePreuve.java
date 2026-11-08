package tg.ipnetinstitute.technology.features.paiement.application;

import org.springframework.core.io.Resource;
import java.io.InputStream;

/**
 * DIP (Dependency Inversion) : interface de stockage des pièces justificatives.
 * Permet de basculer du stockage local vers S3/MinIO sans impacter le service de paiement.
 */
public interface StockagePreuve {
    String enregistrer(InputStream contenu, String nomOriginal, String typeMime);
    Resource lire(String chemin);
}
