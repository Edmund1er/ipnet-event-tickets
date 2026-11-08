-- Flyway Migration V1__init_schema.sql
-- Conforme intégralement à la section 7.2 du Cahier des Charges

-- 1. Table Utilisateur
CREATE TABLE IF NOT EXISTS utilisateur (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    telephone VARCHAR(20) NOT NULL UNIQUE,
    telephone_verifie BOOLEAN NOT NULL DEFAULT FALSE,
    mot_de_passe_hash VARCHAR(100) NOT NULL,
    type_profil VARCHAR(20) NOT NULL CHECK (type_profil IN ('ETUDIANT', 'VISITEUR', 'AUCUN')),
    role VARCHAR(20) NOT NULL CHECK (role IN ('PARTICIPANT', 'ADMIN', 'SCANNER')),
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    tentatives_echec SMALLINT NOT NULL DEFAULT 0,
    verrouille_jusqu_a TIMESTAMP NULL,
    cree_le TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0
);

-- 2. Table Filiere
CREATE TABLE IF NOT EXISTS filiere (
    id BIGSERIAL PRIMARY KEY,
    libelle VARCHAR(150) NOT NULL UNIQUE,
    actif BOOLEAN NOT NULL DEFAULT TRUE
);

-- 3. Table Etudiant
CREATE TABLE IF NOT EXISTS etudiant (
    utilisateur_id BIGINT PRIMARY KEY REFERENCES utilisateur(id) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    adresse VARCHAR(255) NOT NULL,
    filiere_id BIGINT NOT NULL REFERENCES filiere(id),
    annee_inscription_l1 SMALLINT NOT NULL,
    filiere_verrouillee BOOLEAN NOT NULL DEFAULT FALSE
);

-- 4. Table Historique Changement Filiere
CREATE TABLE IF NOT EXISTS historique_changement_filiere (
    id BIGSERIAL PRIMARY KEY,
    etudiant_id BIGINT NOT NULL REFERENCES etudiant(utilisateur_id) ON DELETE CASCADE,
    ancienne_filiere_id BIGINT NULL REFERENCES filiere(id),
    nouvelle_filiere_id BIGINT NOT NULL REFERENCES filiere(id),
    modifie_le TIMESTAMP NOT NULL,
    modifie_par BIGINT NOT NULL REFERENCES utilisateur(id)
);

-- 5. Table Categorie Visiteur
CREATE TABLE IF NOT EXISTS categorie_visiteur (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    libelle VARCHAR(100) NOT NULL,
    actif BOOLEAN NOT NULL DEFAULT TRUE
);

-- 6. Table Visiteur
CREATE TABLE IF NOT EXISTS visiteur (
    utilisateur_id BIGINT PRIMARY KEY REFERENCES utilisateur(id) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    adresse VARCHAR(255) NOT NULL,
    categorie_id BIGINT NOT NULL REFERENCES categorie_visiteur(id),
    organisation VARCHAR(150) NULL
);

-- 7. Table Verification OTP
CREATE TABLE IF NOT EXISTS verification_otp (
    id BIGSERIAL PRIMARY KEY,
    utilisateur_id BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    code_hash VARCHAR(100) NOT NULL,
    expire_le TIMESTAMP NOT NULL,
    tentatives SMALLINT NOT NULL DEFAULT 0 CHECK (tentatives <= 5),
    consomme BOOLEAN NOT NULL DEFAULT FALSE
);

-- 8. Table Evenement
CREATE TABLE IF NOT EXISTS evenement (
    id BIGSERIAL PRIMARY KEY,
    titre VARCHAR(200) NOT NULL,
    description TEXT NULL,
    date_debut TIMESTAMP NOT NULL,
    lieu VARCHAR(255) NULL,
    prix NUMERIC(12,2) NOT NULL CHECK (prix >= 0),
    devise CHAR(3) NOT NULL,
    capacite INTEGER NOT NULL CHECK (capacite > 0),
    places_reservees INTEGER NOT NULL DEFAULT 0 CHECK (places_reservees >= 0 AND places_reservees <= capacite),
    statut VARCHAR(20) NOT NULL CHECK (statut IN ('BROUILLON', 'PUBLIE', 'TERMINE', 'ANNULE')),
    cree_par BIGINT NOT NULL REFERENCES utilisateur(id),
    cree_le TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0
);

-- 9. Table Inscription
CREATE TABLE IF NOT EXISTS inscription (
    id BIGSERIAL PRIMARY KEY,
    utilisateur_id BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    evenement_id BIGINT NOT NULL REFERENCES evenement(id) ON DELETE CASCADE,
    statut VARCHAR(30) NOT NULL CHECK (statut IN ('EN_ATTENTE_PAIEMENT', 'PREUVE_ENVOYEE', 'REJETEE', 'CONFIRMEE', 'ANNULEE', 'EXPIREE')),
    cree_le TIMESTAMP NOT NULL,
    expire_le TIMESTAMP NULL,
    version BIGINT NOT NULL DEFAULT 0,
    motif_annulation VARCHAR(50) NULL,
    CONSTRAINT uk_inscription_utilisateur_evenement UNIQUE (utilisateur_id, evenement_id)
);

CREATE INDEX IF NOT EXISTS idx_inscription_evenement_statut ON inscription(evenement_id, statut);
CREATE INDEX IF NOT EXISTS idx_inscription_statut_expire ON inscription(statut, expire_le);

-- 10. Table Paiement
CREATE TABLE IF NOT EXISTS paiement (
    id BIGSERIAL PRIMARY KEY,
    inscription_id BIGINT NOT NULL UNIQUE REFERENCES inscription(id) ON DELETE CASCADE,
    reference_operateur VARCHAR(50) NULL UNIQUE,
    montant NUMERIC(12,2) NOT NULL,
    devise CHAR(3) NOT NULL,
    chemin_preuve VARCHAR(255) NULL,
    empreinte_preuve CHAR(64) NULL UNIQUE,
    statut VARCHAR(20) NOT NULL CHECK (statut IN ('EN_ATTENTE', 'VALIDE', 'REJETE', 'A_REMBOURSER', 'REMBOURSE')),
    valide_par BIGINT NULL REFERENCES utilisateur(id),
    valide_le TIMESTAMP NULL,
    motif_rejet VARCHAR(255) NULL,
    version BIGINT NOT NULL DEFAULT 0
);

-- 11. Table Releve Transaction
CREATE TABLE IF NOT EXISTS releve_transaction (
    id BIGSERIAL PRIMARY KEY,
    reference_operateur VARCHAR(50) NOT NULL UNIQUE,
    montant NUMERIC(12,2) NOT NULL,
    date_transaction TIMESTAMP NULL,
    importe_le TIMESTAMP NOT NULL,
    rapproche BOOLEAN NOT NULL DEFAULT FALSE
);

-- 12. Table Billet
CREATE TABLE IF NOT EXISTS billet (
    id UUID PRIMARY KEY,
    inscription_id BIGINT NOT NULL UNIQUE REFERENCES inscription(id) ON DELETE CASCADE,
    nonce CHAR(32) NOT NULL,
    scanne_le TIMESTAMP NULL,
    scanne_par BIGINT NULL REFERENCES utilisateur(id),
    invalide BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0
);

-- 13. Table Journal Scan
CREATE TABLE IF NOT EXISTS journal_scan (
    id BIGSERIAL PRIMARY KEY,
    billet_id UUID NULL REFERENCES billet(id),
    evenement_id BIGINT NOT NULL REFERENCES evenement(id),
    agent_id BIGINT NOT NULL REFERENCES utilisateur(id),
    resultat VARCHAR(30) NOT NULL CHECK (resultat IN ('ACCEPTE', 'DEJA_UTILISE', 'INVALIDE', 'MAUVAIS_EVENEMENT', 'EVENEMENT_ANNULE')),
    horodatage TIMESTAMP NOT NULL
);

-- 14. Table Journal Audit
CREATE TABLE IF NOT EXISTS journal_audit (
    id BIGSERIAL PRIMARY KEY,
    acteur_id BIGINT NULL REFERENCES utilisateur(id),
    action VARCHAR(50) NOT NULL,
    type_cible VARCHAR(50) NOT NULL,
    id_cible VARCHAR(50) NOT NULL,
    details TEXT NULL,
    horodatage TIMESTAMP NOT NULL
);

-- 15. Table Outbox Notification
CREATE TABLE IF NOT EXISTS outbox_notification (
    id BIGSERIAL PRIMARY KEY,
    canal VARCHAR(10) NOT NULL,
    destinataire VARCHAR(255) NOT NULL,
    modele VARCHAR(50) NOT NULL,
    charge TEXT NOT NULL,
    statut VARCHAR(15) NOT NULL,
    tentatives SMALLINT NOT NULL DEFAULT 0,
    cree_le TIMESTAMP NOT NULL
);

-- 16. Données de Référence Initiales
INSERT INTO filiere (libelle, actif) VALUES 
('Génie Logiciel', TRUE),
('Réseaux et Télécoms', TRUE),
('Cybersécurité', TRUE),
('Systèmes d''Information', TRUE)
ON CONFLICT (libelle) DO NOTHING;

INSERT INTO categorie_visiteur (code, libelle, actif) VALUES 
('PARENT', 'Parent d''élève', TRUE),
('ETUDIANT_EXTERNE', 'Étudiant externe', TRUE),
('RECRUTEUR', 'Recruteur / Entreprise', TRUE),
('AUTRE', 'Autre visiteur', TRUE)
ON CONFLICT (code) DO NOTHING;
