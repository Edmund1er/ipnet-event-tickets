# Pages d'événement dynamiques : cahier d'implémentation

Statut : **proposition, rien n'est implémenté**. Ce document décrit comment faire, et comment brancher plus tard un modèle d'IA.

## 1. Objectif

Chaque événement doit s'afficher comme un mini-site vitrine avec ses propres couleurs, images, ambiance et mise en page, **sans écrire de code par événement**. Que la plateforme compte 1 ou 1000 événements, le code front reste le même : seules les données changent.

Contraintes :
- Un seul modèle de page React, piloté par des données venant de l'API Spring Boot.
- Le module de réservation reste identique (choix du billet, paiement Mobile Money, billet QR) quel que soit le design.
- L'administrateur configure tout depuis le back-office, sans développeur.

## 2. Principe général

Un événement porte deux objets de configuration, en plus de ses champs actuels :

1. **`theme`** : l'identité visuelle (couleurs, police, formes).
2. **`sections`** : la liste ordonnée des blocs de la page, chacun avec son type, sa variante et ses données.

Le front lit ces deux objets et assemble la page. Le code ne contient que des **types de sections** réutilisables, jamais une page « spécifique à l'événement X ».

```
API  ->  { evenement, theme, sections[] }  ->  <PageEvenement>
                                                  |- applique le thème (variables CSS)
                                                  |- pour chaque section : composant selon son type
                                                  `- section "reservation" : module unique
```

## 3. Modèle de données

### 3.1 Colonnes ajoutées à la table `evenement`

| Colonne    | Type    | Rôle                                              |
|------------|---------|---------------------------------------------------|
| `theme`    | JSONB   | Couleurs, police, style des boutons, style du hero |
| `sections` | JSONB   | Liste ordonnée des sections                       |
| `preset`   | varchar | Préréglage d'origine (mariage, soirée…), informatif |

Les images (bannière, galerie, intervenants) sont des fichiers envoyés séparément ; le JSON ne contient que leurs identifiants ou URL.

### 3.2 Forme du `theme`

```json
{
  "couleurs": {
    "primaire": "#ff6a3d",
    "secondaire": "#eab308",
    "fond": "#fefce8",
    "texte": "#262626"
  },
  "police": "inter",
  "boutons": "arrondis",
  "hero": "plein-ecran"
}
```

Valeurs fermées (listes autorisées) pour `police`, `boutons` et `hero`. Les couleurs sont validées (format hexadécimal) et leur **contraste est vérifié** (voir 7).

### 3.3 Forme de `sections`

```json
[
  { "id": "s1", "type": "hero", "variante": "plein-ecran",
    "donnees": { "titre": "...", "sousTitre": "...", "image": "img_12", "cta": "Réserver" } },
  { "id": "s2", "type": "a_propos", "variante": "deux-colonnes",
    "donnees": { "texte": "...", "image": "img_13" } },
  { "id": "s3", "type": "programme", "variante": "chronologie",
    "donnees": { "activites": [ { "heure": "18:00", "titre": "Accueil", "description": "..." } ] } },
  { "id": "s4", "type": "reservation", "donnees": {} }
]
```

Règles : chaque section a un `id` stable, un `type` connu, une `variante` optionnelle (valeur par défaut sinon) et des `donnees` conformes au schéma de ce type.

### 3.4 Bibliothèque de types de sections (première version)

| Type           | Contenu                                    | Variantes prévues                  |
|----------------|--------------------------------------------|------------------------------------|
| `hero`         | Titre, sous-titre, image, bouton           | plein écran, deux colonnes, dégradé |
| `a_propos`     | Texte et image                             | deux colonnes, centré              |
| `programme`    | Liste d'activités horaires                 | chronologie, cartes                |
| `intervenants` | Personnes (nom, rôle, photo)               | grille, liste                      |
| `galerie`      | Images                                     | grille, bandeau                    |
| `lieu`         | Adresse, carte, accès                      | simple, avec carte                 |
| `chiffres`     | Compteurs (places, durée…)                 | ligne, cartes                      |
| `faq`          | Questions et réponses                      | accordéon                          |
| `reservation`  | Module de réservation unifié (obligatoire) | une seule                          |

Ajouter un événement à la mise en page très particulière = ajouter **un nouveau type** à cette bibliothèque. Il devient ensuite disponible pour tous les événements.

## 4. Côté backend (Spring Boot)

- Migration : ajouter `theme`, `sections`, `preset` à `evenement` (JSONB sur PostgreSQL/Supabase).
- Entités et DTO : champs `theme` et `sections` dans les requêtes de création et de modification, et dans la réponse de détail.
- **Validation serveur** : à l'enregistrement, valider le JSON contre un schéma (types autorisés, champs obligatoires, tailles maximales, couleurs valides, une seule section `reservation` obligatoire). Un JSON invalide est refusé avec un message clair. Cette validation est la même quelle que soit l'origine du JSON (formulaire ou IA).
- Assainissement : tout texte affiché est nettoyé ; jamais de HTML libre ni de script dans les données.
- Images : endpoints d'envoi pour bannière, galerie, intervenants (taille et type contrôlés), comme pour l'image d'événement existante.
- Rétrocompatibilité : un événement sans `theme` ni `sections` reçoit un thème et une page par défaut générés à partir de ses champs actuels (titre, description, date, lieu, prix). Aucun événement existant ne casse.

## 5. Côté frontend (React)

Arborescence proposée dans `features/evenements/` :

```
page-dynamique/
  PageEvenement.tsx        # assemble thème + sections
  theme/
    appliquerTheme.ts      # theme -> variables CSS
    polices.ts             # liste fermée de polices
  sections/
    index.ts               # registre : type -> composant
    Hero.tsx  APropos.tsx  Programme.tsx  Intervenants.tsx
    Galerie.tsx  Lieu.tsx  Chiffres.tsx  Faq.tsx
    Reservation.tsx        # module unifié existant
  schemas.ts               # types TypeScript + validation (zod)
```

Fonctionnement :
1. `PageEvenement` charge l'événement, applique le thème en variables CSS sur son conteneur (`--ev-primaire`, `--ev-secondaire`, `--ev-fond`, `--ev-texte`).
2. Elle parcourt `sections` ; pour chaque entrée, elle cherche le composant dans le **registre** et lui passe `variante` et `donnees`.
3. Un type inconnu est ignoré sans casser la page (compatibilité avec de futurs types).
4. Les composants utilisent uniquement les variables `--ev-*` pour leurs couleurs, jamais de couleur fixe.
5. La section `reservation` réutilise le flux actuel de réservation et de paiement ; seules ses couleurs viennent du thème.

Le thème de l'événement s'applique **uniquement dans la page de l'événement**. Le reste de l'application (en-tête, espace connecté) garde le style de la plateforme.

## 6. Éditeur côté administrateur

Dans la création et la modification d'événement :
1. **Choix d'un préréglage** (Mariage, Soirée, Conférence, Anniversaire, Campus) : pré-remplit thème et sections.
2. **Couleurs, police, style** : sélecteurs avec **aperçu en direct** de la vraie page.
3. **Sections** : liste que l'on réordonne, active ou désactive ; chaque section ouvre un petit formulaire (généré à partir de son schéma).
4. **Images** : envoi de la bannière, de la galerie, des photos d'intervenants.
5. **Publication** : un événement reste en brouillon tant que la validation n'est pas passée.

L'éditeur ne produit que le JSON `theme` et `sections` ; il n'existe aucun code propre à un événement.

## 7. Qualité, accessibilité et sécurité

- **Contraste** : à l'enregistrement, vérifier le contraste texte/fond et bouton/texte (ratio minimal WCAG AA 4,5:1). Si insuffisant, avertir l'admin et proposer une correction automatique.
- **Performance** : images redimensionnées côté serveur, chargement différé de la galerie.
- **Sécurité** : pas de HTML ni de CSS libres venant des données ; polices et variantes en listes fermées ; tailles limitées.
- **Tests** : tests de schéma (JSON valides et invalides), test d'affichage de chaque type de section, test de bout en bout d'un événement avec thème sur le parcours de réservation.

## 8. Plan de réalisation

| Phase | Contenu                                                                 |
|-------|-------------------------------------------------------------------------|
| 1     | Migration, DTO, validation serveur, thème par défaut. Moteur de thème et `PageEvenement` avec `hero`, `a_propos`, `reservation`. |
| 2     | Autres types de sections et variantes, préréglages, images supplémentaires. |
| 3     | Éditeur admin avec aperçu en direct et vérification de contraste.       |
| 4     | (Plus tard) Génération assistée par IA, voir section 9.                 |

Ce découpage permet de livrer une page déjà personnalisée dès la phase 1.

## 9. Intégration future d'un modèle d'IA

### 9.1 Idée

L'IA ne génère **pas de code** : elle génère le **JSON `theme` + `sections`** à partir d'une description. C'est ce qui rend l'ajout d'IA simple et sûr : elle remplit le même format que l'éditeur manuel, et passe par la même validation.

Exemples d'usages :
- **Création assistée** : l'admin décrit l'événement (« soirée de gala, ambiance élégante, noir et or, 200 personnes ») ; l'IA propose un thème, un choix de sections et des textes.
- **Reprise d'un site existant** : à partir de l'URL d'un événement (ex. un site comme orncity.com), l'IA extrait le contenu et propose un thème et des sections proches.
- **Rédaction** : amélioration ou traduction des descriptions, génération du programme et de la FAQ.
- **Variantes** : proposer 3 options de style que l'admin compare avant de choisir.

### 9.2 Architecture

```
Admin (brief, URL, image) -> Backend Spring (service IA) -> API du modèle
                                   |
                         JSON proposé par le modèle
                                   |
                    Validation serveur (même schéma qu'en 4)
                                   |
                      Brouillon affiché dans l'éditeur
                                   |
                     L'admin relit, corrige, publie
```

Points clés :
- L'appel au modèle se fait **uniquement depuis le backend** ; la clé d'API reste dans les variables d'environnement, jamais dans le front.
- Le modèle reçoit le **schéma** (types de sections, champs, valeurs autorisées) et doit répondre uniquement avec du JSON conforme (sortie structurée).
- La réponse passe **toujours** par la validation serveur. Si elle est invalide, on relance une fois avec le message d'erreur, puis on renvoie une erreur claire.
- Le résultat est un **brouillon** : l'admin le voit dans l'éditeur avec l'aperçu et le publie lui-même. L'IA ne publie jamais seule.
- Les images ne sont pas générées au départ : l'admin envoie les siennes ; l'IA peut seulement suggérer des emplacements et des textes alternatifs.

### 9.3 Ce qu'il faut prévoir dès maintenant

Pour que l'IA s'ajoute sans refonte :
1. **Schéma unique et versionné** des sections (une seule source de vérité, utilisée par le formulaire, la validation serveur et le prompt de l'IA).
2. **Champ `version_schema`** dans le JSON, pour faire évoluer les types sans casser les anciens événements.
3. **Registre des types côté serveur** exposé par un endpoint (liste des types, variantes, champs), ce qui sert à la fois à l'éditeur et au prompt.
4. **Validation indépendante de l'origine** : la même fonction valide le JSON saisi à la main et celui de l'IA.
5. **Journalisation** : enregistrer quelle proposition vient de l'IA, pour pouvoir la relire ou la régénérer.

### 9.4 Contraintes et garde-fous IA

- **Coût et limites** : plafonner le nombre de générations par admin et par jour ; mettre en cache les résultats identiques.
- **Données personnelles** : ne jamais envoyer au modèle d'informations sur les participants ; seulement le contenu de l'événement.
- **Injection de contenu** : si l'IA lit une URL externe, son texte est traité comme **donnée non fiable** ; la sortie reste filtrée par le schéma, donc aucune instruction du site lu ne peut modifier autre chose qu'un JSON valide.
- **Droits** : respecter les droits d'auteur du site de référence ; l'IA s'inspire de la structure, elle ne recopie pas les textes ni les images d'un tiers sans autorisation.
- **Repli** : si l'IA est indisponible, l'éditeur manuel et les préréglages fonctionnent normalement.

### 9.5 Phases IA possibles

| Étape | Contenu                                                              |
|-------|----------------------------------------------------------------------|
| A     | Génération du thème et des sections à partir d'un texte descriptif   |
| B     | Rédaction et traduction des contenus (description, programme, FAQ)   |
| C     | Reprise de structure depuis une URL de référence                     |
| D     | Propositions multiples comparables dans l'éditeur                    |

## 10. Décisions à valider avant de coder

1. Liste finale des types de sections de la première version.
2. Liste des polices autorisées.
3. Les préréglages à proposer et leur contenu par défaut.
4. Les droits : qui peut modifier le thème d'un événement (administrateur seulement ?).
5. Analyse de la page de référence (orncity.com) pour calibrer les sections et variantes.
