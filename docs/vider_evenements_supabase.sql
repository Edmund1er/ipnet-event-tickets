-- Nettoyage de TOUS les événements et de leurs données liées dans Supabase.
--
-- GARDE-FOUS :
-- 1) Faire un backup Supabase avant toute suppression réelle.
-- 2) Ce script n'est pas exécuté par l'application. Il est destiné au SQL Editor Supabase.
-- 3) Il supprime les inscriptions, paiements, billets QR, scans, audits événementiels
--    et notifications en attente liées aux événements. Il conserve utilisateurs,
--    comptes admin/scanner, paramètres, filières, catégories et relevés bancaires importés.
-- 4) La dernière instruction est ROLLBACK : la première exécution ne conserve rien.
--    Après vérification des nombres affichés, remplacer uniquement ROLLBACK par COMMIT.
-- 5) Les fichiers Supabase Storage (images/ et preuves/) ne sont PAS supprimés par SQL.
--    Le nettoyage de ces fichiers doit se faire séparément dans Storage après vérification.

BEGIN;

CREATE TEMP TABLE _evenements_a_supprimer ON COMMIT DROP AS
SELECT id FROM public.evenement;

-- Vérifier le périmètre avant suppression.
SELECT
  (SELECT count(*) FROM _evenements_a_supprimer) AS evenements,
  (SELECT count(*) FROM public.inscription i WHERE i.evenement_id IN (SELECT id FROM _evenements_a_supprimer)) AS inscriptions,
  (SELECT count(*) FROM public.paiement p JOIN public.inscription i ON i.id = p.inscription_id WHERE i.evenement_id IN (SELECT id FROM _evenements_a_supprimer)) AS paiements,
  (SELECT count(*) FROM public.billet b JOIN public.inscription i ON i.id = b.inscription_id WHERE i.evenement_id IN (SELECT id FROM _evenements_a_supprimer)) AS billets_qr,
  (SELECT count(*) FROM public.journal_scan s WHERE s.evenement_id IN (SELECT id FROM _evenements_a_supprimer)) AS scans,
  (SELECT count(*) FROM public.journal_audit a WHERE
      (a.type_cible = 'EVENEMENT' AND a.id_cible IN (SELECT id::text FROM _evenements_a_supprimer))
      OR (a.type_cible = 'INSCRIPTION' AND a.id_cible IN (SELECT i.id::text FROM public.inscription i WHERE i.evenement_id IN (SELECT id FROM _evenements_a_supprimer)))
      OR (a.type_cible = 'PAIEMENT' AND a.id_cible IN (SELECT p.id::text FROM public.paiement p JOIN public.inscription i ON i.id = p.inscription_id WHERE i.evenement_id IN (SELECT id FROM _evenements_a_supprimer)))) AS audits_evenementiels;

-- journal_scan n'a pas de suppression en cascade vers billet/evenement.
DELETE FROM public.journal_scan
WHERE evenement_id IN (SELECT id FROM _evenements_a_supprimer);

-- Effacer les audits visant un événement, une inscription ou un paiement supprimé.
DELETE FROM public.journal_audit a
WHERE (a.type_cible = 'EVENEMENT' AND a.id_cible IN (SELECT id::text FROM _evenements_a_supprimer))
   OR (a.type_cible = 'INSCRIPTION' AND a.id_cible IN (SELECT i.id::text FROM public.inscription i WHERE i.evenement_id IN (SELECT id FROM _evenements_a_supprimer)))
   OR (a.type_cible = 'PAIEMENT' AND a.id_cible IN (SELECT p.id::text FROM public.paiement p JOIN public.inscription i ON i.id = p.inscription_id WHERE i.evenement_id IN (SELECT id FROM _evenements_a_supprimer)));

-- Ne pas laisser l'outbox envoyer après le nettoyage des anciens billets/réservations.
DELETE FROM public.outbox_notification
WHERE modele IN ('BILLET_EMIS', 'PREUVE_REJETEE', 'EVENEMENT_ANNULE', 'INSCRIPTION_GRATUITE_CONFIRMEE');

-- Les FK en cascade suppriment les activités/pass enfants, inscriptions, paiements et billets.
DELETE FROM public.evenement
WHERE id IN (SELECT id FROM _evenements_a_supprimer);

-- Contrôle dans la transaction avant de décider entre ROLLBACK et COMMIT.
SELECT count(*) AS evenements_restants FROM public.evenement;
SELECT count(*) AS inscriptions_restantes FROM public.inscription;
SELECT count(*) AS billets_restants FROM public.billet;

-- Première exécution : laisser ROLLBACK pour annuler et vérifier les comptages ci-dessus.
-- Pour exécuter réellement, remplacer la ligne suivante par COMMIT puis relancer le script.
ROLLBACK;
