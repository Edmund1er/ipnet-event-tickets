-- ============================================================================
-- Comptes de TEST : étudiant interne et visiteur externe (e-mail déjà vérifié)
-- À exécuter dans Supabase : SQL Editor -> New query -> coller -> Run.
-- Réexécutable sans danger : les comptes existants ne sont pas dupliqués.
--
-- Connexion sur le site :
--   Étudiant interne : etudiant.test@ipnet.test  /  Test1234
--   Visiteur externe : visiteur.test@ipnet.test  /  Test1234
--
-- À SUPPRIMER avant la mise en production (voir la fin du fichier).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Étudiant interne ---------------------------------------------------------
INSERT INTO utilisateur (email, telephone, telephone_verifie, mot_de_passe_hash, type_profil, role,
                         actif, tentatives_echec, cree_le, version, email_verifie)
SELECT 'etudiant.test@ipnet.test', '+22890000001', FALSE, crypt('Test1234', gen_salt('bf', 10)),
       'ETUDIANT', 'PARTICIPANT', TRUE, 0, NOW(), 0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM utilisateur WHERE email = 'etudiant.test@ipnet.test');

INSERT INTO etudiant (utilisateur_id, nom, prenom, filiere_id, annee_inscription_l1, filiere_verrouillee)
SELECT u.id, 'TEST', 'Étudiant',
       (SELECT id FROM filiere WHERE libelle = 'Génie Logiciel'),
       EXTRACT(YEAR FROM NOW())::smallint - 1, FALSE
FROM utilisateur u
WHERE u.email = 'etudiant.test@ipnet.test'
  AND NOT EXISTS (SELECT 1 FROM etudiant e WHERE e.utilisateur_id = u.id);

-- 2) Visiteur externe ---------------------------------------------------------
INSERT INTO utilisateur (email, telephone, telephone_verifie, mot_de_passe_hash, type_profil, role,
                         actif, tentatives_echec, cree_le, version, email_verifie)
SELECT 'visiteur.test@ipnet.test', '+22890000002', FALSE, crypt('Test1234', gen_salt('bf', 10)),
       'VISITEUR', 'PARTICIPANT', TRUE, 0, NOW(), 0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM utilisateur WHERE email = 'visiteur.test@ipnet.test');

INSERT INTO visiteur (utilisateur_id, nom, prenom, categorie_id, organisation)
SELECT u.id, 'TEST', 'Visiteur',
       (SELECT id FROM categorie_visiteur WHERE code = 'ETUDIANT_EXTERNE'),
       'Université partenaire'
FROM utilisateur u
WHERE u.email = 'visiteur.test@ipnet.test'
  AND NOT EXISTS (SELECT 1 FROM visiteur v WHERE v.utilisateur_id = u.id);

-- 3) Contrôle : doit afficher 2 lignes ----------------------------------------
SELECT u.id, u.email, u.type_profil, u.role, u.email_verifie, u.actif
FROM utilisateur u
WHERE u.email IN ('etudiant.test@ipnet.test', 'visiteur.test@ipnet.test');

-- ============================================================================
-- NETTOYAGE (à lancer à part, quand les tests sont finis) :
-- DELETE FROM utilisateur WHERE email IN ('etudiant.test@ipnet.test', 'visiteur.test@ipnet.test');
-- (les lignes etudiant / visiteur partent en cascade ; supprimez d'abord leurs
--  réservations s'il y en a.)
-- ============================================================================
