-- Flyway Migration V3__motif_inscription_255.sql
-- Le motif de rejet d'un paiement (jusqu'à 255 caractères, cf. paiement.motif_rejet) est recopié
-- dans inscription.motif_annulation lors du passage à REJETEE : la colonne doit pouvoir le contenir.
ALTER TABLE inscription ALTER COLUMN motif_annulation TYPE VARCHAR(255);
