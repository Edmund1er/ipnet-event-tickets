package tg.ipnetinstitute.technology.config;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * Accepte l'URL de connexion telle que fournie par Supabase, Render ou Heroku
 * ({@code postgresql://utilisateur:motdepasse@hote:port/base}) dans {@code DATABASE_URL} ou {@code DB_URL},
 * et la convertit en URL JDBC + identifiants (mot de passe décodé : {@code %23} devient {@code #}).
 * Une URL déjà au format {@code jdbc:...} n'est pas touchée.
 */
public class UrlBaseDonneesPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment env, SpringApplication app) {
        for (String cle : new String[] {"DATABASE_URL", "DB_URL"}) {
            String valeur = env.getProperty(cle);
            Map<String, Object> props = convertir(valeur);
            if (props != null) {
                env.getPropertySources().addFirst(new MapPropertySource("urlBaseDonnees", props));
                return;
            }
        }
    }

    /** @return les propriétés spring.datasource.* ou null si la valeur n'est pas une URL postgres(ql)://. */
    static Map<String, Object> convertir(String valeur) {
        if (valeur == null) return null;
        String v = valeur.trim();
        if (!v.startsWith("postgres://") && !v.startsWith("postgresql://")) return null;
        URI uri = URI.create(v);
        Map<String, Object> props = new HashMap<>();
        int port = uri.getPort() > 0 ? uri.getPort() : 5432;
        String requete = uri.getRawQuery() == null ? "sslmode=require" : uri.getRawQuery();
        props.put("spring.datasource.url", "jdbc:postgresql://" + uri.getHost() + ":" + port + uri.getRawPath() + "?" + requete);
        String info = uri.getRawUserInfo();
        if (info != null) {
            int i = info.indexOf(':');
            props.put("spring.datasource.username", decoder(i < 0 ? info : info.substring(0, i)));
            if (i >= 0) props.put("spring.datasource.password", decoder(info.substring(i + 1)));
        }
        return props;
    }

    private static String decoder(String s) {
        return URLDecoder.decode(s.replace("+", "%2B"), StandardCharsets.UTF_8);
    }
}
