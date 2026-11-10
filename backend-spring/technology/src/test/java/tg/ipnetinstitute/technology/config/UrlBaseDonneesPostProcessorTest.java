package tg.ipnetinstitute.technology.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.Map;
import org.junit.jupiter.api.Test;

class UrlBaseDonneesPostProcessorTest {

    @Test
    void convertitUneUrlPostgresEnJdbcEtDecodeLeMotDePasse() {
        Map<String, Object> p = UrlBaseDonneesPostProcessor.convertir(
                "postgresql://postgres.abc:Mot%2316@aws-0-eu-west-1.pooler.supabase.com:5432/postgres");
        assertEquals("jdbc:postgresql://aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require", p.get("spring.datasource.url"));
        assertEquals("postgres.abc", p.get("spring.datasource.username"));
        assertEquals("Mot#16", p.get("spring.datasource.password"));
    }

    @Test
    void neTouchePasUneUrlJdbc() {
        assertNull(UrlBaseDonneesPostProcessor.convertir("jdbc:postgresql://localhost:5432/ipnet_db"));
        assertNull(UrlBaseDonneesPostProcessor.convertir(null));
    }

    @Test
    void tolereGuillemetsEtNomDeVariable() {
        assertEquals("Mot#16", UrlBaseDonneesPostProcessor.convertir("DB_URL=\"postgresql://u:Mot%2316@h:5432/postgres\"").get("spring.datasource.password"));
    }
}
