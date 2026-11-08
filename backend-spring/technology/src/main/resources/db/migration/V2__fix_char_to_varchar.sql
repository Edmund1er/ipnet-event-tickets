-- Flyway Migration V2__fix_char_to_varchar.sql
-- Correction : convertir les colonnes CHAR en VARCHAR pour la compatibilité Hibernate
-- PostgreSQL stocke CHAR comme bpchar, Hibernate attend VARCHAR sur les champs String

-- Table evenement : devise CHAR(3) → VARCHAR(3)
ALTER TABLE evenement ALTER COLUMN devise TYPE VARCHAR(3);

-- Table paiement : devise CHAR(3) → VARCHAR(3)
ALTER TABLE paiement ALTER COLUMN devise TYPE VARCHAR(3);

-- Table paiement : empreinte_preuve CHAR(64) → VARCHAR(64)
ALTER TABLE paiement ALTER COLUMN empreinte_preuve TYPE VARCHAR(64);

-- Table billet : nonce CHAR(32) → VARCHAR(32)
ALTER TABLE billet ALTER COLUMN nonce TYPE VARCHAR(32);
