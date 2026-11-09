package tg.ipnetinstitute.technology.support;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.springframework.test.context.DynamicPropertyRegistry;

import java.io.IOException;

/**
 * PostgreSQL réel (binaire embarqué, sans Docker), partagé par les tests d'intégration SQL :
 * migrations Flyway, contraintes en base, concurrence. Une base distincte par appel de {@link #brancher}.
 */
public final class PostgresEmbarque {

    private static EmbeddedPostgres serveur;
    private static int compteur = 0;

    private PostgresEmbarque() {}

    private static synchronized EmbeddedPostgres serveur() {
        if (serveur == null) {
            try {
                serveur = EmbeddedPostgres.builder().start();
                Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                    try { serveur.close(); } catch (IOException ignored) { }
                }));
            } catch (IOException e) {
                throw new IllegalStateException("PostgreSQL embarqué indisponible", e);
            }
        }
        return serveur;
    }

    /** Crée une base vierge et la branche sur Spring avec Flyway actif et validation Hibernate. */
    public static synchronized void brancher(DynamicPropertyRegistry r) {
        String nom = "test_" + (++compteur);
        try (var c = serveur().getPostgresDatabase().getConnection(); var st = c.createStatement()) {
            st.execute("CREATE DATABASE " + nom);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
        r.add("spring.datasource.url", () -> "jdbc:postgresql://localhost:" + serveur().getPort() + "/" + nom + "?user=postgres");
        r.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        r.add("spring.datasource.username", () -> "postgres");
        r.add("spring.datasource.password", () -> "postgres");
        r.add("spring.flyway.enabled", () -> "true");
        r.add("spring.flyway.locations", () -> "classpath:db/migration");
        r.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
    }
}
