package tg.ipnetinstitute.technology.features.evenement.utils;

import org.springframework.data.jpa.domain.Specification;
import tg.ipnetinstitute.technology.features.evenement.model.Evenement;
import tg.ipnetinstitute.technology.features.evenement.model.StatutEvenement;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * EF-13 : critères de recherche combinables (pattern Specification).
 */
public final class FiltresEvenementUtils {

    private FiltresEvenementUtils() {}

    public record Filtre(String titre, LocalDate dateMin, LocalDate dateMax, BigDecimal prixMin, BigDecimal prixMax) {}

    /**
     * Qui regarde la liste :
     * PUBLIC (clients) : événements principaux à venir, jamais les masqués ni les passés ;
     * CONTROLE (scan) : activités et pass inclus, même déjà commencés ;
     * ADMIN : événements principaux de tous âges, sauf les masqués.
     */
    public enum Visibilite { PUBLIC, CONTROLE, ADMIN }

    public static Specification<Evenement> specification(StatutEvenement statut, Filtre f) {
        return specification(statut, f, Visibilite.ADMIN);
    }

    public static Specification<Evenement> specification(StatutEvenement statut, Filtre f, Visibilite visibilite) {
        Specification<Evenement> spec = (root, q, cb) -> cb.isFalse(root.get("masque"));
        if (visibilite != Visibilite.CONTROLE) {
            spec = spec.and((root, q, cb) -> cb.isNull(root.get("parentId")));
        }
        if (visibilite == Visibilite.PUBLIC) {
            var maintenant = java.time.LocalDateTime.now();
            spec = spec.and((root, q, cb) -> cb.greaterThanOrEqualTo(cb.coalesce(root.<java.time.LocalDateTime>get("dateFin"), root.<java.time.LocalDateTime>get("dateDebut")), maintenant));
        }
        if (statut != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("statut"), statut));
        }
        if (f == null) return spec;
        String titre = f.titre() == null ? null : f.titre().trim().toLowerCase();
        if (titre != null && !titre.isEmpty()) {
            String motif = "%" + titre.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
            spec = spec.and((root, q, cb) -> cb.like(cb.lower(root.get("titre")), motif, '\\'));
        }
        if (f.dateMin() != null) {
            spec = spec.and((root, q, cb) -> cb.greaterThanOrEqualTo(root.get("dateDebut"), f.dateMin().atStartOfDay()));
        }
        if (f.dateMax() != null) {
            spec = spec.and((root, q, cb) -> cb.lessThan(root.get("dateDebut"), f.dateMax().plusDays(1).atStartOfDay()));
        }
        if (f.prixMin() != null) {
            spec = spec.and((root, q, cb) -> cb.greaterThanOrEqualTo(root.get("prix"), f.prixMin()));
        }
        if (f.prixMax() != null) {
            spec = spec.and((root, q, cb) -> cb.lessThanOrEqualTo(root.get("prix"), f.prixMax()));
        }
        return spec;
    }
}
