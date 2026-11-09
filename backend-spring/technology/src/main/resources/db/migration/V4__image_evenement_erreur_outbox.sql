-- Flyway Migration V4__image_evenement_erreur_outbox.sql
-- EF-10 : image facultative de l'événement (fichier stocké hors du répertoire web, nom aléatoire)
ALTER TABLE evenement ADD COLUMN IF NOT EXISTS image_chemin VARCHAR(255) NULL;

-- EF-31 : dernière erreur d'envoi d'une notification, visible par l'administrateur
ALTER TABLE outbox_notification ADD COLUMN IF NOT EXISTS derniere_erreur VARCHAR(500) NULL;
CREATE INDEX IF NOT EXISTS idx_outbox_statut_cree ON outbox_notification(statut, cree_le);

-- RG-17 : montant figé dès la réservation (et non à la soumission de la référence)
ALTER TABLE inscription ADD COLUMN IF NOT EXISTS montant NUMERIC(12,2) NULL;
ALTER TABLE inscription ADD COLUMN IF NOT EXISTS devise VARCHAR(3) NULL;
UPDATE inscription i SET montant = e.prix, devise = e.devise FROM evenement e WHERE e.id = i.evenement_id AND i.montant IS NULL;
