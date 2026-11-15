-- L'organisateur choisit si une inscription gratuite produit un billet QR.
-- Les événements existants gardent le comportement actuel (QR activé).
ALTER TABLE evenement
    ADD COLUMN IF NOT EXISTS qr_pour_gratuit BOOLEAN NOT NULL DEFAULT TRUE;
