package tg.ipnetinstitute.technology.features.notification.wrapper;

import tg.ipnetinstitute.technology.features.notification.model.ModeCanal;

import java.util.List;

/**
 * Strategy pour le canal de diffusion des notifications (OCP).
 * Une implémentation doit lever une exception si l'envoi échoue : l'outbox rejouera l'envoi.
 */
public interface CanalNotification {

    /** Pièce jointe ; si cid est renseigné, elle est aussi intégrée dans le corps HTML (src="cid:..."). */
    record PieceJointe(String nomFichier, byte[] contenu, String typeMime, String cid) {}

    record MessageSortant(String destinataire, String sujet, String corpsHtml, List<PieceJointe> piecesJointes) {}

    ModeCanal canal();

    void envoyer(MessageSortant message) throws Exception;
}
