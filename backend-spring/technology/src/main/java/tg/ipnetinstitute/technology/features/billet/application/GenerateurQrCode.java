package tg.ipnetinstitute.technology.features.billet.application;

/**
 * Strategy pour la génération d'image de QR code (Section 9.7).
 */
public interface GenerateurQrCode {
    byte[] generer(String contenu, int taille);
}
