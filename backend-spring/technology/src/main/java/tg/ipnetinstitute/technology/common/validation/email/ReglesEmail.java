package tg.ipnetinstitute.technology.common.validation.email;

import jakarta.mail.internet.AddressException;
import jakarta.mail.internet.InternetAddress;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import tg.ipnetinstitute.technology.common.exception.EmailInvalideException;

import javax.naming.NamingException;
import javax.naming.directory.Attribute;
import javax.naming.directory.InitialDirContext;
import java.net.IDN;
import java.util.Hashtable;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Règles fournies par défaut (RG-01) : syntaxe RFC 5322 stricte (Jakarta Mail),
 * puis existence d'un serveur de messagerie pour le domaine (enregistrement DNS MX, ou A à défaut).
 * La possession de l'adresse est ensuite prouvée par le code de confirmation envoyé par e-mail.
 */
@Configuration
public class ReglesEmail {

    private static final Logger log = LoggerFactory.getLogger(ReglesEmail.class);

    /** 1. Syntaxe RFC 5322 stricte, sans nom affiché ni domaine sans point. */
    @Bean
    @Order(10)
    RegleEmail regleSyntaxe() {
        return adresse -> {
            try {
                InternetAddress ia = new InternetAddress(adresse, true);
                ia.validate();
                String domaine = adresse.substring(adresse.lastIndexOf('@') + 1);
                if (ia.getPersonal() != null || !domaine.contains(".") || domaine.startsWith("[") || adresse.length() > 254) {
                    throw new AddressException();
                }
            } catch (AddressException | StringIndexOutOfBoundsException e) {
                throw new EmailInvalideException("Adresse e-mail invalide : vérifiez sa saisie.");
            }
        };
    }

    /** 2. Le domaine accepte des e-mails (DNS MX / A). Désactivable : app.email.verifier-domaine=false. */
    @Bean
    @Order(20)
    RegleEmail regleDomaineJoignable(@Value("${app.email.verifier-domaine:true}") boolean actif,
                                     @Value("${app.email.dns-timeout-ms:3000}") int timeoutMs) {
        var cache = new ConcurrentHashMap<String, Boolean>();
        return adresse -> {
            if (!actif) return;
            String domaine = IDN.toASCII(adresse.substring(adresse.lastIndexOf('@') + 1));
            Boolean existe = cache.get(domaine);
            if (existe == null) {
                existe = domaineAccepteEmails(domaine, timeoutMs);
                if (existe != null) cache.put(domaine, existe);
            }
            if (Boolean.FALSE.equals(existe)) {
                throw new EmailInvalideException("Le domaine « " + domaine + " » ne reçoit pas d'e-mails : vérifiez l'adresse.");
            }
        };
    }

    /**
     * @return TRUE si le domaine accepte des e-mails, FALSE s'il n'existe pas ou publie un « MX nul » (RFC 7505),
     *         null si le DNS est injoignable (on ne bloque alors pas l'utilisateur ; le code de confirmation tranchera).
     */
    private static Boolean domaineAccepteEmails(String domaine, int timeoutMs) {
        Hashtable<String, String> env = new Hashtable<>();
        env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
        env.put("com.sun.jndi.dns.timeout.initial", String.valueOf(timeoutMs));
        env.put("com.sun.jndi.dns.timeout.retries", "2");
        try {
            InitialDirContext ctx = new InitialDirContext(env);
            try {
                Attribute mx = ctx.getAttributes(domaine, new String[]{"MX"}).get("MX");
                if (mx != null && mx.size() > 0) {
                    // RFC 7505 : un unique MX « 0 . » signifie que le domaine refuse tout e-mail
                    boolean mxNul = mx.size() == 1 && String.valueOf(mx.get(0)).trim().matches("0\\s+\\.?");
                    return !mxNul;
                }
            } finally {
                ctx.close();
            }
        } catch (javax.naming.NameNotFoundException e) {
            return false; // NXDOMAIN : le domaine n'existe pas
        } catch (NamingException e) {
            log.debug("Requête MX impossible pour {} : {}", domaine, e.getMessage());
        }
        // Sans MX, la RFC 5321 autorise la livraison sur l'adresse du domaine (A/AAAA) : résolveur du système
        try {
            return java.net.InetAddress.getAllByName(domaine).length > 0;
        } catch (java.net.UnknownHostException e) {
            return false;
        } catch (SecurityException e) {
            log.warn("Vérification DNS du domaine {} impossible : {}", domaine, e.getMessage());
            return null;
        }
    }
}
