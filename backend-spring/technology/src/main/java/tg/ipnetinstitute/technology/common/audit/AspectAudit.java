package tg.ipnetinstitute.technology.common.audit;

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

    @AfterReturning("@annotation(auditable)")
    public void journaliser(JoinPoint jp, Auditable auditable) {
        try {
            Long acteurId = extraireActeurId();
            String idCible = extraireIdCible(jp.getArgs());

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

    private String extraireIdCible(Object[] args) {
        if (args != null && args.length > 0 && args[0] != null) {
            return String.valueOf(args[0]);
        }
        return "N/A";
    }
}
