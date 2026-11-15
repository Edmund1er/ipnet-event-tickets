ALTER TABLE paiement
    ADD COLUMN operateur_paiement VARCHAR(10),
    ADD COLUMN numero_payeur VARCHAR(20),
    ADD CONSTRAINT ck_paiement_operateur CHECK (operateur_paiement IS NULL OR operateur_paiement IN ('MOOV', 'MIXX'));
