-- Apparence de la page d'un événement : ambiance (liste fermée côté application) et couleur principale
ALTER TABLE evenement ADD COLUMN IF NOT EXISTS ambiance VARCHAR(30) NULL;
ALTER TABLE evenement ADD COLUMN IF NOT EXISTS couleur_principale VARCHAR(7) NULL;
