-- Masquage définitif d'un événement passé : il disparaît de toutes les listes sans perdre ses réservations ni ses billets
ALTER TABLE evenement ADD COLUMN IF NOT EXISTS masque BOOLEAN NOT NULL DEFAULT FALSE;
