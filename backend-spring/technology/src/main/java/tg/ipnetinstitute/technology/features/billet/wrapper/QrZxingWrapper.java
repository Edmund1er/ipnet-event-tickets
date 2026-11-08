package tg.ipnetinstitute.technology.features.billet.wrapper;

/**
 * Strategy pour la génération d'image de QR code (Section 9.7).
 */
public interface QrZxingWrapper {
    byte[] generer(String contenu, int taille);
}
