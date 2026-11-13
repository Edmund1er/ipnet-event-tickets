-- Événement-cadre (semaine culturelle…), activités et pass rattachés à un cadre.
-- Une activité ou un pass est lui-même une ligne de « evenement » : réservation, paiement, billet et contrôle restent inchangés.
ALTER TABLE evenement ADD COLUMN IF NOT EXISTS parent_id BIGINT NULL REFERENCES evenement(id) ON DELETE CASCADE;
ALTER TABLE evenement ADD COLUMN IF NOT EXISTS type VARCHAR(15) NOT NULL DEFAULT 'EVENEMENT';
ALTER TABLE evenement ADD COLUMN IF NOT EXISTS date_fin TIMESTAMP NULL;
ALTER TABLE evenement ADD COLUMN IF NOT EXISTS categorie VARCHAR(30) NULL;
ALTER TABLE evenement ADD COLUMN IF NOT EXISTS acces_libre BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE evenement ADD COLUMN IF NOT EXISTS pass_portee VARCHAR(10) NULL;
ALTER TABLE evenement ADD COLUMN IF NOT EXISTS pass_jour DATE NULL;
CREATE INDEX IF NOT EXISTS idx_evenement_parent ON evenement(parent_id);
