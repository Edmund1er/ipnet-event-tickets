# Nouvelle implémentation : pages d'événement dynamiques

Proposition d'évolution de la fiche événement : une page web défilante, composée de sections que l'administrateur assemble (activités, images publicitaires, vidéos). Un événement sans contenu supplémentaire garde l'affichage actuel.

> Ce document propose une conception améliorée. Il ne se limite pas à la demande initiale et peut être ajusté avant réalisation.

## 1. Objectifs

- Transformer la fiche d'un événement en **page de présentation riche** (type « landing page »).
- Permettre à l'administrateur de composer cette page **sans toucher au code**.
- Présenter un **programme d'activités** (jour, semaine, mois, horaires) quand il existe.
- Rester **optionnel** : aucun événement n'est obligé d'avoir des sections ou des activités.
- Rester **100 % gratuit** à héberger (Render, Vercel, Supabase).

## 2. Modèle de données (migration Flyway `V8`)

| Table | Rôle | Champs principaux |
|---|---|---|
| `evenement_section` | Un bloc de la page | `id`, `evenement_id`, `type`, `titre`, `contenu`, `ordre`, `visible` |
| `evenement_media` | Image ou vidéo d'une section | `id`, `section_id`, `type` (`IMAGE`, `VIDEO_LIEN`), `chemin` ou `url`, `legende`, `ordre` |
| `evenement_activite` | Une activité du programme | `id`, `evenement_id`, `titre`, `description`, `debut`, `fin`, `lieu`, `image_chemin`, `ordre` |

Types de section : `TEXTE`, `GALERIE`, `VIDEO`, `PROGRAMME`, `CHIFFRES_CLES`, `INTERVENANTS`, `FAQ`, `APPEL_ACTION`.

Choix de conception :

- **Pas de modèle de récurrence.** Une activité = une date/heure de début et de fin. Les vues Jour / Semaine / Mois sont **calculées côté front** à partir de ces dates, ce qui évite la complexité des règles de répétition.
- **Aucune section obligatoire.** Sans section, la page publique reste identique à celle d'aujourd'hui.
- **Suppression en cascade** : supprimer une section supprime ses médias.
- Suppression logique via `visible` pour préparer un contenu sans le publier.

## 3. API

Public (sans authentification) :

- `GET /api/evenements/{id}/page` : renvoie en **un seul appel** les sections visibles, leurs médias et les activités, triés.

Administrateur :

- `POST|PUT|DELETE /api/admin/evenements/{id}/sections[/{sectionId}]`
- `PUT /api/admin/evenements/{id}/sections/ordre` : réordonnancement en une requête.
- `POST|PUT|DELETE /api/admin/evenements/{id}/activites[/{activiteId}]`
- `POST /api/admin/sections/{sectionId}/medias` (image en multipart, ou lien vidéo) et `DELETE`.
- `POST /api/admin/evenements/{id}/dupliquer-contenu` : copier la page d'un événement vers un autre (gain de temps pour les événements récurrents).

Règles : seules les entrées d'un événement **non clôturé et non annulé** sont modifiables (cohérent avec `exigerModifiable`) ; types MIME et poids des images contrôlés ; liens vidéo limités à YouTube, Vimeo et Google Drive.

## 4. Espace administrateur

Nouvel onglet **« Contenu de la page »** dans la modification d'un événement :

1. Bouton « Ajouter une section » avec choix du type.
2. Édition de chaque section dans un panneau repliable.
3. Réordonnancement par flèches (le glisser-déposer pourra venir ensuite).
4. Liste des activités avec formulaire : titre, date, heure de début et de fin, lieu, description, image.
5. **Aperçu** de la page publique avant publication.
6. Enregistrement automatique des brouillons.

## 5. Page publique

- **Bandeau d'en-tête** : image principale, titre, date, lieu, prix, places restantes, bouton « Réserver » toujours accessible (barre fixe sur mobile).
- **Sections dans l'ordre choisi**, avec apparition douce au défilement et ancres de navigation.
- **Programme** : chronologie avec onglets **Jour / Semaine / Mois**, regroupement par jour, filtre par date.
- **Galerie** : grille ou carrousel, zoom au clic, chargement différé (`loading="lazy"`).
- **Vidéo** : intégration YouTube/Vimeo chargée à la demande (aperçu cliquable) pour ne pas alourdir la page.
- **Ajouter au calendrier** (fichier `.ics`) pour une activité ou l'événement entier.
- **Partage** : lien direct et aperçu social (titre, image).
- Design aligné sur le gabarit ScrewFast avec les couleurs IPNET (bleu, rouge).

## 6. Stockage des médias (point bloquant)

Les images sont aujourd'hui écrites sur le disque (`./uploads/images`). Sur le plan gratuit de Render, **le disque est effacé à chaque redéploiement** : les images publicitaires disparaîtraient.

Recommandation :

- **Supabase Storage** (déjà utilisé pour la base, 1 Go gratuit) ou Cloudinary pour les images.
- Abstraction `StockageMedia` (interface) avec deux implémentations : disque (local) et Supabase (production).
- **Vidéos : liens uniquement.** Pas d'hébergement de fichiers vidéo (poids, limite de 5 Mo, bande passante).
- Compression des images au téléversement (largeur maximale 1600 px) pour économiser le quota.

## 7. Sécurité, performance et accessibilité

- Contenu texte **assaini** (pas de HTML libre, ou liste blanche) pour éviter les failles XSS.
- Réponse publique **mise en cache** (ETag / `Cache-Control` court) car la page change peu.
- Textes alternatifs pour les images, navigation clavier, respect de `prefers-reduced-motion`.
- Audit des modifications admin (`@Auditable`, déjà présent dans le projet).

## 8. Tests

- Backend : création, tri, réordonnancement, droits admin, événement clôturé non modifiable, cascade de suppression.
- Frontend : rendu avec et sans section, regroupement Jour/Semaine/Mois, fuseau horaire.
- E2E (Playwright) : l'admin compose une page, le visiteur la consulte et réserve.

## 9. Plan de réalisation

| Étape | Contenu | Dépendance |
|---|---|---|
| 1 | Stockage externe des images (Supabase Storage) | Clés Supabase |
| 2 | Migration `V8` + entités + API sections, activités, médias | Étape 1 pour les images |
| 3 | Éditeur administrateur (onglet « Contenu de la page ») | Étape 2 |
| 4 | Page publique défilante + vues Jour/Semaine/Mois | Étape 2 |
| 5 | Aperçu, duplication, export `.ics`, partage | Étapes 3 et 4 |
| 6 | Tests, accessibilité, performance | Toutes |

## 10. Idées complémentaires (hors périmètre initial)

- Inscription par **activité** (ateliers à places limitées) en plus de l'événement global.
- Rappels par e-mail la veille d'une activité.
- Modèles de page prêts à l'emploi (conférence, concert, remise de diplômes).
- Statistiques de consultation par section.

## 11. Reste à faire côté messagerie (rappel)

Le code d'envoi est prêt. À compléter avec les valeurs de configuration :

1. Brevo : désactiver la restriction d'IP et valider l'expéditeur.
2. Render : variables `BREVO_API_KEY`, `MAIL_EXPEDITEUR`, `MAIL_NOM_EXPEDITEUR`.
3. Régénérer la clé API après les essais.
4. Tester une inscription réelle (code à 6 chiffres).
