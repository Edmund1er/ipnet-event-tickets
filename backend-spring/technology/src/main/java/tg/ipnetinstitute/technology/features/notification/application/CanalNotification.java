package tg.ipnetinstitute.technology.features.notification.application;

import tg.ipnetinstitute.technology.features.notification.domaine.ModeCanal;

/**
 * Strategy pour le canal de diffusion des notifications (OCP).
 */
public interface CanalNotification {
    ModeCanal canal();
    void envoyer(String destinataire, String titre, String corps);
}
