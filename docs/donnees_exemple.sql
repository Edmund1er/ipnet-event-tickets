-- ============================================================================
-- Données d'EXEMPLE : événements réalistes pour voir toute la plateforme en action.
-- À exécuter dans Supabase : SQL Editor -> New query -> coller -> Run.
-- Les dates sont calculées à partir d'aujourd'hui : tout est « à venir » au moment du lancement.
-- Les événements sont créés par le compte administrateur romaricali73@gmail.com.
-- Réexécutable : un événement du même titre n'est pas recréé.
-- NETTOYAGE : voir la fin du fichier.
-- ============================================================================

DO $$
DECLARE
    admin_id BIGINT := (SELECT id FROM utilisateur WHERE email = 'romaricali73@gmail.com');
    base TIMESTAMP := date_trunc('day', NOW());
    cadre BIGINT;

    -- Crée un événement s'il n'existe pas déjà (même titre) et renvoie son id.
    -- Colonnes : titre, description, début, fin, lieu, prix, capacité, ambiance, couleur, type, parent, catégorie, accès libre, portée du pass, jour du pass
BEGIN
    IF admin_id IS NULL THEN
        RAISE EXCEPTION 'Compte administrateur introuvable : adaptez l''adresse e-mail en haut du script';
    END IF;

    -- 1) Journée portes ouvertes : gratuite, sur inscription ---------------------------------------------------
    INSERT INTO evenement (titre, description, date_debut, lieu, prix, devise, capacite, places_reservees, statut,
                           cree_par, cree_le, version, ambiance, couleur_principale, type)
    SELECT 'Journée portes ouvertes IPNET',
           E'Venez découvrir IPNET Institute of Technology : visite des laboratoires informatiques et réseaux, rencontre avec les enseignants et les étudiants, présentation des filières (Génie Logiciel, Réseaux et Télécoms, Cybersécurité) et des débouchés.\n\nUn atelier d''initiation à la programmation est proposé toutes les heures. Entrée gratuite, inscription obligatoire pour recevoir votre billet.',
           base + INTERVAL '9 days 9 hours', 'Campus IPNET, Lomé', 0, 'XOF', 300, 0, 'PUBLIE',
           admin_id, NOW(), 0, 'ACADEMIQUE', '#1e3a8a', 'EVENEMENT'
    WHERE NOT EXISTS (SELECT 1 FROM evenement WHERE titre = 'Journée portes ouvertes IPNET');

    -- 2) Gala des diplômés : payant, ambiance cérémonie ---------------------------------------------------------
    INSERT INTO evenement (titre, description, date_debut, lieu, prix, devise, capacite, places_reservees, statut,
                           cree_par, cree_le, version, ambiance, couleur_principale, type)
    SELECT 'Soirée de gala des diplômés 2026',
           E'La promotion 2026 reçoit ses diplômes lors d''une soirée de gala : discours du directeur, remise des prix d''excellence, dîner et soirée dansante.\n\nTenue de soirée exigée. Le billet comprend le dîner et une boisson. Ouverture des portes à 18 h 30.',
           base + INTERVAL '21 days 19 hours', 'Salle des fêtes de l''hôtel du 2 Février, Lomé', 15000, 'XOF', 250, 0, 'PUBLIE',
           admin_id, NOW(), 0, 'CEREMONIE', '#b8860b', 'EVENEMENT'
    WHERE NOT EXISTS (SELECT 1 FROM evenement WHERE titre = 'Soirée de gala des diplômés 2026');

    -- 3) Tournoi de football inter-filières ---------------------------------------------------------------------
    INSERT INTO evenement (titre, description, date_debut, lieu, prix, devise, capacite, places_reservees, statut,
                           cree_par, cree_le, version, ambiance, couleur_principale, type)
    SELECT 'Tournoi de football inter-filières',
           E'Les équipes de chaque filière s''affrontent pour la coupe IPNET. Huit équipes, matchs de 20 minutes, finale à 17 h.\n\nVenez encourager votre filière : buvette sur place, remise de la coupe à la fin de la finale.',
           base + INTERVAL '12 days 14 hours', 'Stade municipal de Bè, Lomé', 500, 'XOF', 400, 0, 'PUBLIE',
           admin_id, NOW(), 0, 'SPORT', '#16a34a', 'EVENEMENT'
    WHERE NOT EXISTS (SELECT 1 FROM evenement WHERE titre = 'Tournoi de football inter-filières');

    -- 4) Conférence ------------------------------------------------------------------------------------------------
    INSERT INTO evenement (titre, description, date_debut, lieu, prix, devise, capacite, places_reservees, statut,
                           cree_par, cree_le, version, ambiance, couleur_principale, type)
    SELECT 'Conférence : l''intelligence artificielle au service des entreprises togolaises',
           E'Trois intervenants de l''industrie et de la recherche présentent des cas concrets d''usage de l''intelligence artificielle dans la banque, la santé et l''agriculture au Togo.\n\nPrévoyez une pièce d''identité. Une attestation de participation est remise sur demande.',
           base + INTERVAL '16 days 15 hours', 'Amphithéâtre principal, IPNET', 2000, 'XOF', 180, 0, 'PUBLIE',
           admin_id, NOW(), 0, 'ACADEMIQUE', '#0f766e', 'EVENEMENT'
    WHERE NOT EXISTS (SELECT 1 FROM evenement WHERE titre LIKE 'Conférence : l''intelligence artificielle%');

    -- 5) Événement sans description ni image : la plateforme affiche une simple carte ---------------------------
    INSERT INTO evenement (titre, description, date_debut, lieu, prix, devise, capacite, places_reservees, statut,
                           cree_par, cree_le, version, type)
    SELECT 'Atelier CV et entretien d''embauche', NULL,
           base + INTERVAL '6 days 10 hours', NULL, 0, 'XOF', 40, 0, 'PUBLIE',
           admin_id, NOW(), 0, 'EVENEMENT'
    WHERE NOT EXISTS (SELECT 1 FROM evenement WHERE titre = 'Atelier CV et entretien d''embauche');

    -- 6) Programme sur plusieurs jours : Semaine culturelle ---------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM evenement WHERE titre = 'Semaine culturelle IPNET 2026') THEN
        INSERT INTO evenement (titre, description, date_debut, date_fin, lieu, prix, devise, capacite, places_reservees,
                               statut, cree_par, cree_le, version, ambiance, couleur_principale, type)
        VALUES ('Semaine culturelle IPNET 2026',
                E'Cinq jours de sport, de danse, de jeux et de culture, de 8 h à 22 h, ouverts à tous les étudiants. Chaque activité a son propre billet ; le pass donne accès à tout le programme.',
                base + INTERVAL '25 days 7 hours', base + INTERVAL '29 days 22 hours', 'Campus IPNET, Lomé', 0, 'XOF', 1, 0,
                'PUBLIE', admin_id, NOW(), 0, 'CULTURE', '#ea580c', 'CADRE')
        RETURNING id INTO cadre;

        -- Jour 1 (lundi)
        INSERT INTO evenement (titre, description, date_debut, date_fin, lieu, prix, devise, capacite, places_reservees,
                               statut, cree_par, cree_le, version, type, parent_id, categorie, acces_libre)
        VALUES
        ('Cérémonie d''ouverture', 'Discours officiels, présentation du programme et spectacle d''ouverture.',
         base + INTERVAL '25 days 9 hours', base + INTERVAL '25 days 10 hours 30 minutes', 'Cour centrale', 0, 'XOF', 400, 0, 'PUBLIE', admin_id, NOW(), 0, 'ACTIVITE', cadre, 'CULTURE', FALSE),
        ('Exposition d''art et de photographie', 'Œuvres des étudiants et des clubs de l''institut. Entrée libre toute la journée.',
         base + INTERVAL '25 days 10 hours 30 minutes', base + INTERVAL '25 days 17 hours', 'Hall d''exposition', 0, 'XOF', 1, 0, 'PUBLIE', admin_id, NOW(), 0, 'ACTIVITE', cadre, 'CULTURE', TRUE),
        ('Tournoi de jeux de société', 'Awalé, dames et échecs : inscription par équipes de deux.',
         base + INTERVAL '25 days 14 hours', base + INTERVAL '25 days 17 hours', 'Salle polyvalente', 0, 'XOF', 60, 0, 'PUBLIE', admin_id, NOW(), 0, 'ACTIVITE', cadre, 'JEUX', FALSE),
        -- Jour 2 (mardi)
        ('Initiation à la danse traditionnelle', 'Atelier animé par une troupe de Lomé : rythmes et pas de base.',
         base + INTERVAL '26 days 16 hours', base + INTERVAL '26 days 18 hours', 'Salle polyvalente', 0, 'XOF', 50, 0, 'PUBLIE', admin_id, NOW(), 0, 'ACTIVITE', cadre, 'DANSE', FALSE),
        ('Soirée karaoké', 'Chantez vos titres préférés sur scène. Boissons en vente sur place.',
         base + INTERVAL '26 days 20 hours', base + INTERVAL '26 days 22 hours', 'Cour centrale', 1000, 'XOF', 150, 0, 'PUBLIE', admin_id, NOW(), 0, 'ACTIVITE', cadre, 'SOIREE', FALSE),
        -- Jour 3 (mercredi)
        ('Tournoi de basket 3 contre 3', 'Tournoi éliminatoire ouvert à toutes les filières.',
         base + INTERVAL '27 days 15 hours', base + INTERVAL '27 days 18 hours', 'Terrain de sport', 500, 'XOF', 120, 0, 'PUBLIE', admin_id, NOW(), 0, 'ACTIVITE', cadre, 'SPORT', FALSE),
        -- Jour 4 (jeudi)
        ('Table ronde : étudier et entreprendre', 'Anciens diplômés et entrepreneurs racontent leur parcours.',
         base + INTERVAL '28 days 10 hours', base + INTERVAL '28 days 12 hours', 'Amphithéâtre principal', 0, 'XOF', 200, 0, 'PUBLIE', admin_id, NOW(), 0, 'ACTIVITE', cadre, 'CONFERENCE', FALSE),
        -- Jour 5 (vendredi)
        ('Grande soirée de clôture', 'Concert, danses et remise des prix de la semaine.',
         base + INTERVAL '29 days 19 hours', base + INTERVAL '29 days 22 hours', 'Cour centrale', 3000, 'XOF', 300, 0, 'PUBLIE', admin_id, NOW(), 0, 'ACTIVITE', cadre, 'SOIREE', FALSE);

        -- Pass : toute la semaine, et le vendredi seulement
        INSERT INTO evenement (titre, description, date_debut, date_fin, lieu, prix, devise, capacite, places_reservees,
                               statut, cree_par, cree_le, version, type, parent_id, pass_portee, pass_jour)
        VALUES
        ('Pass semaine complet', NULL, base + INTERVAL '25 days 7 hours', base + INTERVAL '29 days 22 hours', 'Campus IPNET, Lomé',
         6000, 'XOF', 200, 0, 'PUBLIE', admin_id, NOW(), 0, 'PASS', cadre, 'GLOBAL', NULL),
        ('Pass du vendredi', NULL, base + INTERVAL '29 days', base + INTERVAL '29 days 23 hours 59 minutes', 'Campus IPNET, Lomé',
         3000, 'XOF', 150, 0, 'PUBLIE', admin_id, NOW(), 0, 'PASS', cadre, 'JOURNEE', (base + INTERVAL '29 days')::date);
    END IF;
END $$;

-- Contrôle : liste des événements principaux créés
SELECT id, titre, type, statut, date_debut::date AS debut, prix FROM evenement WHERE parent_id IS NULL ORDER BY id;

-- ============================================================================
-- NETTOYAGE (à lancer à part, quand vous n'en avez plus besoin).
-- Les activités et pass partent avec leur programme. Supprimez d'abord les réservations éventuelles.
-- DELETE FROM evenement WHERE titre IN (
--   'Journée portes ouvertes IPNET', 'Soirée de gala des diplômés 2026', 'Tournoi de football inter-filières',
--   'Atelier CV et entretien d''embauche', 'Semaine culturelle IPNET 2026')
--   OR titre LIKE 'Conférence : l''intelligence artificielle%';
-- ============================================================================
