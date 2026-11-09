-- Flyway Migration V5__email_verifie_parametres_unicite_qr.sql

-- RG-01 / RG-20 : l'adresse e-mail doit être vérifiée (code envoyé par e-mail).
-- Aucune adresse existante n'a été confirmée par un code réel : toutes repartent à « non vérifiée ».
ALTER TABLE utilisateur ADD COLUMN IF NOT EXISTS email_verifie BOOLEAN NOT NULL DEFAULT FALSE;

-- Codes à usage unique : vérification de l'adresse courante ou changement d'adresse (EF-08)
ALTER TABLE verification_otp ADD COLUMN IF NOT EXISTS objet VARCHAR(30) NOT NULL DEFAULT 'VERIFICATION_EMAIL';
ALTER TABLE verification_otp ADD COLUMN IF NOT EXISTS cible VARCHAR(255) NULL;
ALTER TABLE verification_otp DROP CONSTRAINT IF EXISTS ck_verification_otp_objet;
ALTER TABLE verification_otp ADD CONSTRAINT ck_verification_otp_objet CHECK (objet IN ('VERIFICATION_EMAIL', 'CHANGEMENT_EMAIL'));
CREATE INDEX IF NOT EXISTS idx_otp_utilisateur_objet ON verification_otp(utilisateur_id, objet, consomme);

-- RG-12 : chaque QR code est unique (UUID du billet + nonce aléatoire de 128 bits, signés HMAC)
CREATE UNIQUE INDEX IF NOT EXISTS uk_billet_nonce ON billet(nonce);

-- Paramètres de la plateforme modifiables par l'administrateur (ex. numéro Mobile Money, EF-07)
CREATE TABLE IF NOT EXISTS parametre_plateforme (
    cle VARCHAR(60) PRIMARY KEY,
    valeur VARCHAR(500) NOT NULL,
    modifie_le TIMESTAMP NOT NULL,
    modifie_par BIGINT NULL REFERENCES utilisateur(id)
);
