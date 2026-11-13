package tg.ipnetinstitute.technology.features.evenement.model;

/**
 * EVENEMENT : événement simple (comportement historique).
 * CADRE : programme sur plusieurs jours (non vendu lui-même, regroupe des activités et des pass).
 * ACTIVITE : élément du programme d'un cadre (payant, gratuit sur inscription ou en accès libre).
 * PASS : billet donnant accès à plusieurs activités d'un cadre (toute la durée ou un jour précis).
 */
public enum TypeEvenement {
    EVENEMENT, CADRE, ACTIVITE, PASS
}
