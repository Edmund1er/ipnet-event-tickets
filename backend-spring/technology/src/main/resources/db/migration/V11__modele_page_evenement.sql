-- Modèle de mise en page de la page publique d'un événement (liste fermée côté application)
ALTER TABLE evenement ADD COLUMN IF NOT EXISTS modele VARCHAR(20) NULL;
