package tg.ipnetinstitute.technology.database;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import tg.ipnetinstitute.technology.support.PostgresEmbarque;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Uniformité base de données / backend, sur un vrai PostgreSQL : les migrations Flyway sont appliquées,
 * puis Hibernate valide chaque entité JPA contre le schéma obtenu (ddl-auto=validate).
 * Une colonne oubliée ou supprimée (comme « adresse ») dans une migration fait échouer ce test.
 * Vérifie aussi les contraintes critiques du cahier (§7.2) directement en SQL.
 */
@SpringBootTest(properties = "app.premier-evenement.actif=false")
class SchemaFlywayCoherenceTest {

    @DynamicPropertySource
    static void base(DynamicPropertyRegistry r) {
        PostgresEmbarque.brancher(r);
    }

    @Autowired JdbcTemplate jdbc;

    @Test
    void lesMigrationsCorrespondentAuxEntites() {
        Integer adresse = jdbc.queryForObject(
                "select count(*) from information_schema.columns where column_name = 'adresse'", Integer.class);
        assertThat(adresse).as("aucune colonne adresse ne doit subsister").isZero();
        Integer attente = jdbc.queryForObject(
                "select count(*) from information_schema.tables where table_name = 'inscription_en_attente'", Integer.class);
        assertThat(attente).isEqualTo(1);
        // Données de référence de démonstration (livrable §11)
        assertThat(jdbc.queryForObject("select count(*) from filiere", Integer.class)).isPositive();
        assertThat(jdbc.queryForObject("select count(*) from categorie_visiteur", Integer.class)).isEqualTo(4);
    }

    @Test
    void contraintesCritiquesEnBase() {
        jdbc.update("insert into utilisateur(email, telephone, mot_de_passe_hash, type_profil, role, cree_le, email_verifie) "
                + "values ('a@x.tg','+22890000001','h','VISITEUR','PARTICIPANT', now(), true)");
        // RG-01 : e-mail unique
        assertThatThrownBy(() -> jdbc.update("insert into utilisateur(email, telephone, mot_de_passe_hash, type_profil, role, cree_le, email_verifie) "
                + "values ('a@x.tg','+22890000002','h','VISITEUR','PARTICIPANT', now(), true)")).isInstanceOf(DataIntegrityViolationException.class);
        // RG-02 : téléphone unique
        assertThatThrownBy(() -> jdbc.update("insert into utilisateur(email, telephone, mot_de_passe_hash, type_profil, role, cree_le, email_verifie) "
                + "values ('b@x.tg','+22890000001','h','VISITEUR','PARTICIPANT', now(), true)")).isInstanceOf(DataIntegrityViolationException.class);
        // CHECK sur le rôle
        assertThatThrownBy(() -> jdbc.update("insert into utilisateur(email, telephone, mot_de_passe_hash, type_profil, role, cree_le, email_verifie) "
                + "values ('c@x.tg','+22890000003','h','VISITEUR','ROOT', now(), true)")).isInstanceOf(DataIntegrityViolationException.class);
        // RG-03 : au plus 5 tentatives
        assertThatThrownBy(() -> jdbc.update("insert into inscription_en_attente(email, telephone, mot_de_passe_hash, type_profil, nom, prenom, code_hash, expire_le, tentatives, cree_le, dernier_envoi_le) "
                + "values ('d@x.tg','+22890000004','h','VISITEUR','N','P','c', now(), 6, now(), now())")).isInstanceOf(DataIntegrityViolationException.class);
    }
}
