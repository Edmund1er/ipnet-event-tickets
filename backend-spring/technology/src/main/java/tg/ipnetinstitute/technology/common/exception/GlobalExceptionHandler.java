package tg.ipnetinstitute.technology.common.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

/**
 * Gestionnaire d'exceptions global conforme à la RFC 9457 ProblemDetail
 * et aux recommandations OWASP (aucune fuite de stack trace ou données sensibles).
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MetierException.class)
    public ProblemDetail handleMetierException(MetierException ex) {
        log.warn("Erreur métier [{}] : {}", ex.getCodeRegle(), ex.getMessage());
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(ex.getStatus(), ex.getMessage());
        problem.setType(URI.create("https://billetterie.ipnetinstitute.tg/erreurs/" + ex.getCodeRegle().toLowerCase()));
        problem.setTitle("Règle métier non satisfaite");
        problem.setProperty("code", ex.getCodeRegle());
        return problem;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidationException(MethodArgumentNotValidException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Données de formulaire invalides");
        problem.setType(URI.create("https://billetterie.ipnetinstitute.tg/erreurs/validation"));
        problem.setTitle("Erreur de validation");

        Map<String, String> erreurs = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            erreurs.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        problem.setProperty("champs", erreurs);
        return problem;
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ProblemDetail handleBadCredentials(BadCredentialsException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Identifiants invalides");
        problem.setType(URI.create("https://billetterie.ipnetinstitute.tg/erreurs/authentification"));
        problem.setTitle("Authentification échouée");
        return problem;
    }

    @ExceptionHandler(LockedException.class)
    public ProblemDetail handleLocked(LockedException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setType(URI.create("https://billetterie.ipnetinstitute.tg/erreurs/compte-verrouille"));
        problem.setTitle("Compte temporairement verrouillé");
        return problem;
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, "Accès refusé : privilèges insuffisants");
        problem.setType(URI.create("https://billetterie.ipnetinstitute.tg/erreurs/acces-refuse"));
        problem.setTitle("Accès interdit");
        return problem;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGenerique(Exception ex) {
        log.error("Erreur serveur inattendue", ex);
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Une erreur interne est survenue. Veuillez contacter l'administrateur.");
        problem.setType(URI.create("https://billetterie.ipnetinstitute.tg/erreurs/interne"));
        problem.setTitle("Erreur interne du serveur");
        return problem;
    }
}
