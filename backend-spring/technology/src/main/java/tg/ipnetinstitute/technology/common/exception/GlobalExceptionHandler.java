package tg.ipnetinstitute.technology.common.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestCookieException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

/**
 * Gestionnaire d'exceptions global conforme à la RFC 9457 ProblemDetail
 * et aux recommandations OWASP (aucune fuite de stack trace ou données sensibles).
 * Chaque réponse porte un champ "code" exploitable par le front.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final String BASE_TYPE = "https://billetterie.ipnetinstitute.tg/erreurs/";

    public static ProblemDetail probleme(HttpStatus status, String slug, String titre, String detail, String code) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setType(URI.create(BASE_TYPE + slug));
        problem.setTitle(titre);
        problem.setProperty("code", code);
        return problem;
    }

    @ExceptionHandler(MetierException.class)
    public ProblemDetail handleMetierException(MetierException ex) {
        log.warn("Erreur métier [{}] : {}", ex.getCodeRegle(), ex.getMessage());
        return probleme(ex.getStatus(), ex.getCodeRegle().toLowerCase(), "Règle métier non satisfaite",
                ex.getMessage(), ex.getCodeRegle());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidationException(MethodArgumentNotValidException ex) {
        ProblemDetail problem = probleme(HttpStatus.BAD_REQUEST, "validation", "Erreur de validation",
                "Données de formulaire invalides", "VALIDATION");
        Map<String, String> erreurs = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            erreurs.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        problem.setProperty("champs", erreurs);
        return problem;
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class, MissingServletRequestPartException.class})
    public ProblemDetail handleRequeteMalformee(Exception ex) {
        log.debug("Requête malformée : {}", ex.getMessage());
        return probleme(HttpStatus.BAD_REQUEST, "requete-invalide", "Requête invalide",
                "La requête est mal formée ou incomplète.", "REQUETE_INVALIDE");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleArgumentInvalide(IllegalArgumentException ex) {
        log.warn("Argument invalide : {}", ex.getMessage());
        return probleme(HttpStatus.BAD_REQUEST, "requete-invalide", "Requête invalide",
                ex.getMessage(), "REQUETE_INVALIDE");
    }

    @ExceptionHandler(IllegalStateException.class)
    public ProblemDetail handleEtatInvalide(IllegalStateException ex) {
        log.warn("Transition ou état invalide : {}", ex.getMessage());
        return probleme(HttpStatus.CONFLICT, "etat-invalide", "Opération impossible dans l'état actuel",
                ex.getMessage(), "ETAT_INVALIDE");
    }

    @ExceptionHandler({DataIntegrityViolationException.class, ObjectOptimisticLockingFailureException.class})
    public ProblemDetail handleConflit(Exception ex) {
        log.warn("Conflit de données : {}", ex.getMessage());
        return probleme(HttpStatus.CONFLICT, "conflit", "Conflit",
                "La ressource a été modifiée ou existe déjà. Veuillez réessayer.", "CONFLIT");
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ProblemDetail handleTailleFichier(MaxUploadSizeExceededException ex) {
        return probleme(HttpStatus.PAYLOAD_TOO_LARGE, "fichier-trop-volumineux", "Fichier trop volumineux",
                "Le fichier dépasse la taille maximale autorisée (5 Mo).", "FICHIER_TROP_VOLUMINEUX");
    }

    @ExceptionHandler(MissingRequestCookieException.class)
    public ProblemDetail handleCookieManquant(MissingRequestCookieException ex) {
        return probleme(HttpStatus.UNAUTHORIZED, "session-expiree", "Session expirée",
                "Aucune session active. Veuillez vous reconnecter.", "SESSION_EXPIREE");
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ProblemDetail handleBadCredentials(BadCredentialsException ex) {
        return probleme(HttpStatus.UNAUTHORIZED, "authentification", "Authentification échouée",
                "Identifiants invalides", "IDENTIFIANTS_INVALIDES");
    }

    @ExceptionHandler(LockedException.class)
    public ProblemDetail handleLocked(LockedException ex) {
        return probleme(HttpStatus.FORBIDDEN, "compte-verrouille", "Compte temporairement verrouillé",
                ex.getMessage(), "COMPTE_VERROUILLE");
    }

    @ExceptionHandler(AuthenticationException.class)
    public ProblemDetail handleAuthentication(AuthenticationException ex) {
        return probleme(HttpStatus.UNAUTHORIZED, "non-authentifie", "Authentification requise",
                "Vous devez être connecté pour accéder à cette ressource.", "NON_AUTHENTIFIE");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException ex) {
        String detail = ex.getMessage() != null && !ex.getMessage().startsWith("Access Denied")
                ? ex.getMessage() : "Accès refusé : privilèges insuffisants";
        return probleme(HttpStatus.FORBIDDEN, "acces-refuse", "Accès interdit", detail, "ACCES_REFUSE");
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ProblemDetail handleRouteInconnue(NoResourceFoundException ex) {
        return probleme(HttpStatus.NOT_FOUND, "introuvable", "Ressource introuvable",
                "La ressource demandée n'existe pas.", "RESSOURCE_INTROUVABLE");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ProblemDetail handleMethode(HttpRequestMethodNotSupportedException ex) {
        return probleme(HttpStatus.METHOD_NOT_ALLOWED, "methode-non-supportee", "Méthode non supportée",
                "Méthode HTTP non supportée pour cette ressource.", "METHODE_NON_SUPPORTEE");
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGenerique(Exception ex) {
        log.error("Erreur serveur inattendue", ex);
        return probleme(HttpStatus.INTERNAL_SERVER_ERROR, "interne", "Erreur interne du serveur",
                "Une erreur interne est survenue. Veuillez contacter l'administrateur.", "ERREUR_INTERNE");
    }
}
