package tg.ipnetinstitute.technology.features.notification.wrapper;

import tg.ipnetinstitute.technology.features.notification.model.ModeCanal;

/**
 * Strategy pour le canal de diffusion des notifications (OCP).
 */
public interface CanalNotification {
    ModeCanal canal();
    void envoyer(String destinataire, String titre, String corps);
}
