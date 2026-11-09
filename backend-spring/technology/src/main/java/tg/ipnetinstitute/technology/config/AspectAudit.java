package tg.ipnetinstitute.technology.config;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Aspect d'audit interceptant les méthodes annotées avec @Auditable (RG-16, OWASP A09).
 */
@Aspect
@Component
public class AspectAudit {

    private static final Logger log = LoggerFactory.getLogger(AspectAudit.class);
    private final JournalAuditRepository journal;

    public AspectAudit(JournalAuditRepository journal) {
        this.journal = journal;
    }

    @AfterReturning(pointcut = "@annotation(auditable)", returning = "resultat")
    public void journaliser(JoinPoint jp, Auditable auditable, Object resultat) {
        try {
            Long acteurId = extraireActeurId();
            String idCible = tronquer(extraireIdCible(jp.getArgs(), resultat), 50);

            JournalAudit entree = new JournalAudit(
                    acteurId,
                    auditable.action(),
                    auditable.typeCible(),
                    idCible,
                    "Exécution avec succès de " + jp.getSignature().getName(),
                    LocalDateTime.now()
            );

            journal.save(entree);
            log.info("Action auditee : action={}, typeCible={}, idCible={}, acteurId={}",
                    auditable.action(), auditable.typeCible(), idCible, acteurId);
        } catch (Exception e) {
            log.error("Échec de journalisation d'audit", e);
        }
    }

    private Long extraireActeurId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Long id) {
            return id;
        }
        return null;
    }

    /**
     * Identifiant de la cible : premier argument s'il s'agit d'un identifiant (Long, UUID…),
     * sinon identifiant porté par le résultat (record DTO avec id() / utilisateurId()).
     * Jamais le toString() d'un DTO, qui contiendrait des données personnelles et dépasserait la colonne.
     */
    private String extraireIdCible(Object[] args, Object resultat) {
        if (args != null && args.length > 0 && estIdentifiant(args[0])) {
            return String.valueOf(args[0]);
        }
        if (resultat != null) {
            if (estIdentifiant(resultat)) {
                return String.valueOf(resultat);
            }
            for (String accesseur : new String[]{"id", "getId", "utilisateurId"}) {
                try {
                    Object valeur = resultat.getClass().getMethod(accesseur).invoke(resultat);
                    if (estIdentifiant(valeur)) {
                        return String.valueOf(valeur);
                    }
                } catch (ReflectiveOperationException ignored) {
                    // accesseur absent : on essaie le suivant
                }
            }
        }
        return "N/A";
    }

    private static boolean estIdentifiant(Object o) {
        return o instanceof Number || o instanceof java.util.UUID;
    }

    private static String tronquer(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max);
    }
}
