-- Clôture et réouverture des ventes : date limite de réservation et suspension manuelle
ALTER TABLE evenement ADD COLUMN IF NOT EXISTS date_limite_reservation TIMESTAMP NULL;
ALTER TABLE evenement ADD COLUMN IF NOT EXISTS ventes_suspendues BOOLEAN NOT NULL DEFAULT FALSE;

-- Resynchronise les séquences d'identifiants avec les données existantes
-- (évite « duplicate key value violates unique constraint » après un import ou une restauration)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT c.table_name, c.column_name,
               pg_get_serial_sequence(quote_ident(c.table_name), c.column_name) AS seq
        FROM information_schema.columns c
        WHERE c.table_schema = current_schema()
          AND c.column_default LIKE 'nextval(%'
    LOOP
        IF r.seq IS NOT NULL THEN
            EXECUTE format('SELECT setval(%L, COALESCE((SELECT MAX(%I) FROM %I), 0) + 1, false)',
                           r.seq, r.column_name, r.table_name);
        END IF;
    END LOOP;
END $$;
