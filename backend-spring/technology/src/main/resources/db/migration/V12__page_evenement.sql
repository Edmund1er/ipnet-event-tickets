-- Contenu de la page publique d'un événement : sections facultatives (JSON validé côté application)
ALTER TABLE evenement ADD COLUMN IF NOT EXISTS page TEXT NULL;
-- Les anciens modèles de mise en page sont remplacés par les types de page : l'administrateur choisira à nouveau
UPDATE evenement SET modele = NULL WHERE modele IN ('CLASSIQUE', 'AFFICHE', 'MAGAZINE', 'EPURE');
