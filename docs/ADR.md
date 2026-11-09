# Décisions d'architecture (ADR)

## ADR-1 — Compte créé seulement après validation du code e-mail
**Contexte** : un compte créé avant vérification permettait à un faux e-mail d'exister (même restreint).
**Décision** : l'inscription est stockée dans `inscription_en_attente` (mot de passe déjà haché, code haché BCrypt,
5 min, 5 essais). `POST /api/auth/inscription/verification` crée `utilisateur` (e-mail vérifié) et le profil, puis ouvre la session.
Purge des demandes de plus de 24 h. **Conséquence** : aucun jeton n'existe avant validation.

## ADR-2 — Suppression du champ « adresse »
Non nécessaire à l'événementiel. Colonnes supprimées (migration V6), DTO et formulaires alignés. Au scan et dans les exports,
la colonne « Profil » (filière, ou catégorie et organisation) remplace l'adresse pour identifier le porteur.

## ADR-3 — Signature des billets
Jeton = `billetId.HMAC-SHA256(billetId|eventId|nonce)` en Base64 URL, vérifié en temps constant avant tout accès au
billet ; le nonce de 128 bits est unique en base. Rien de séquentiel ni de stocké.

## ADR-4 — Stratégie de verrouillage
Réservations : verrou pessimiste sur la ligne `evenement` (`SELECT … FOR UPDATE`) pour sérialiser le décompte des places.
Scan : `@Version` sur `billet` (verrou optimiste). Prouvé par `RegleGestionConcurrenceTest` sur PostgreSQL réel.

## ADR-5 — Stockage des preuves
Hors répertoire web, nom UUID, type MIME vérifié par contenu (Tika), SHA-256 unique (RG-13), servi par endpoint authentifié.

## ADR-6 — Stratégie de test
PostgreSQL embarqué (zonky) plutôt que Testcontainers : pas de Docker requis, migrations Flyway réelles et
`ddl-auto=validate` pour garantir base / backend / entités alignés. Front : Vitest (composants, Zod, gardes) et Playwright
(parcours, accès, responsive) avec API simulée.
