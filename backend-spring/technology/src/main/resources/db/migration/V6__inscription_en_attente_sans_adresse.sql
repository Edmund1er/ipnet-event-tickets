-- Flyway Migration V6 : le compte n'est cree qu'apres validation du code recu par e-mail ;
-- le champ adresse n'est plus collecte.

-- Inscriptions en attente de validation du code (aucun compte utilisateur tant que le code n'est pas valide)
CREATE TABLE IF NOT EXISTS inscription_en_attente (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    telephone VARCHAR(20) NOT NULL,
    mot_de_passe_hash VARCHAR(100) NOT NULL,
    type_profil VARCHAR(20) NOT NULL CHECK (type_profil IN ('ETUDIANT', 'VISITEUR')),
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    filiere_id BIGINT NULL,
    annee_inscription_l1 SMALLINT NULL,
    categorie_id BIGINT NULL,
    organisation VARCHAR(150) NULL,
    code_hash VARCHAR(100) NOT NULL,
    expire_le TIMESTAMP NOT NULL,
    tentatives SMALLINT NOT NULL DEFAULT 0 CHECK (tentatives <= 5),
    cree_le TIMESTAMP NOT NULL,
    dernier_envoi_le TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_inscription_attente_cree ON inscription_en_attente(cree_le);

-- Adresse postale supprimee du modele
ALTER TABLE etudiant DROP COLUMN IF EXISTS adresse;
ALTER TABLE visiteur DROP COLUMN IF EXISTS adresse;

-- Comptes participants crees avant cette regle sans e-mail verifie et sans aucune activite : supprimes (comptes fantomes).
DELETE FROM etudiant WHERE utilisateur_id IN (
    SELECT u.id FROM utilisateur u WHERE u.role = 'PARTICIPANT' AND u.email_verifie = FALSE
      AND NOT EXISTS (SELECT 1 FROM inscription i WHERE i.utilisateur_id = u.id)
      AND NOT EXISTS (SELECT 1 FROM journal_audit a WHERE a.acteur_id = u.id));
DELETE FROM visiteur WHERE utilisateur_id IN (
    SELECT u.id FROM utilisateur u WHERE u.role = 'PARTICIPANT' AND u.email_verifie = FALSE
      AND NOT EXISTS (SELECT 1 FROM inscription i WHERE i.utilisateur_id = u.id)
      AND NOT EXISTS (SELECT 1 FROM journal_audit a WHERE a.acteur_id = u.id));
DELETE FROM verification_otp WHERE utilisateur_id IN (
    SELECT u.id FROM utilisateur u WHERE u.role = 'PARTICIPANT' AND u.email_verifie = FALSE
      AND NOT EXISTS (SELECT 1 FROM inscription i WHERE i.utilisateur_id = u.id)
      AND NOT EXISTS (SELECT 1 FROM journal_audit a WHERE a.acteur_id = u.id));
DELETE FROM utilisateur u WHERE u.role = 'PARTICIPANT' AND u.email_verifie = FALSE
  AND NOT EXISTS (SELECT 1 FROM inscription i WHERE i.utilisateur_id = u.id)
  AND NOT EXISTS (SELECT 1 FROM journal_audit a WHERE a.acteur_id = u.id);
