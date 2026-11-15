# Manuel utilisateur — IPNET Billetterie

## Participant (étudiant interne ou visiteur externe)
1. **Créer un compte** : « Créer un compte », choisir le profil, remplir nom, prénom, e-mail, téléphone, mot de passe
   (12 caractères minimum). Étudiant : filière et année d'inscription en L1 (listes). Visiteur : catégorie et organisation éventuelle.
   Aucune adresse postale n'est demandée.
2. **Valider l'e-mail** : un code à 6 chiffres est envoyé. Il est valable 5 minutes, 5 essais maximum. *Le compte n'est créé
   qu'une fois le code validé* ; sans validation, aucun accès. « Renvoyer un code » est possible toutes les 30 secondes.
3. **Réserver** : ouvrir un événement, « Réserver ». La place est retenue 48 h.
4. **Payer** : choisir Moov Money ou Mixx by Yas, puis utiliser le numéro normal de réception affiché pour ce réseau. Le numéro du portefeuille utilisé pour payer peut être différent du téléphone du compte IPNET. Le bouton d'appel ouvre le menu USSD de l'opérateur (Moov : *155#, puis option 1 ; Mixx : *145*1#). Vérifier le nom du bénéficiaire et le montant chez l'opérateur avant de confirmer. Revenir ensuite sur le site pour saisir le numéro payeur et la **référence de transaction**. Une capture JPG/PNG/PDF (5 Mo) reste facultative. Sans API opérateur, le paiement reste en attente de vérification/rapprochement par l'administration.
5. **Billet** : après validation du paiement, le billet avec QR code arrive par e-mail et reste dans « Mes billets ».
6. **Profil** : modifier nom, prénom, téléphone ; changer d'e-mail (code envoyé à la nouvelle adresse) ; changer de filière
   tant que vous n'avez pas dépassé la L2 ; supprimer le compte.

## Administrateur
- **Événements** : création (titre, description, date et heure, lieu, prix, capacité, image choisie dès la création),
  publication, modification (tant qu'aucune réservation n'est confirmée), clôture, annulation (e-mail à chaque participant ;
  les paiements validés passent « À rembourser »).
- **Page publique d’un événement** : dans la liste des événements, ouvrir « Page ». Choisir l’un des huit styles décrits selon le type d’événement (atelier, tournoi, salon, etc.), puis utiliser « Voir un exemple » avant de valider. La page s’affiche en aperçu pendant la personnalisation.
  - **Image** : dans la section « Bannière », téléverser l’image qui servira de fond au grand visuel. Si aucune photo n’est fournie, les cartes publiques gardent une image locale de secours; elles n’utilisent plus le dégradé aléatoire.
  - **Thème général** : sélectionner une palette pour appliquer un accord de couleurs, ou « Style natif du modèle » pour revenir à son apparence initiale. Les couleurs de l’en-tête, du fond, du texte, des cartes, des boutons et du pied de page se règlent séparément; « Hériter du thème » annule seulement la couleur de cette zone.
  - **Sections et blocs** : ajouter/activer les sections utiles; dans chacune, ajuster ses propres couleurs sans recolorer les autres. « Grille de cartes » et « Colonnes » permettent d’ajouter plusieurs cartes, avec titre, description et image, puis de choisir 2 à 4 colonnes sur grand écran (elles s’empilent sur mobile). Le voile et son intensité règlent la lisibilité du texte sur l’image.
  - **Programme** : ajouter un jour puis les créneaux; seules les journées et activités saisies apparaissent. Vérifier l’aperçu à une largeur mobile, puis cliquer « Enregistrer ». « Enregistrer » sauvegarde la page; publier l’événement reste une action séparée.
- **Paiements** : file des références non rapprochées ; visualiser la capture, valider ou rejeter avec motif.
  **Import du relevé** (CSV `référence;montant;date`) : confirmation automatique quand référence et montant correspondent.
- **Participants et exports** : liste par événement, export des présents en CSV ou PDF.
- **Agents de scan** : créer et désactiver les comptes. **Audit** et **Notifications** (rejeu des envois en échec).
- **Paramètres** : numéro personnel de réception et bénéficiaire pour chacun des portefeuilles Moov Money et Mixx by Yas. Laisser un canal vide le masque du choix participant.

## Agent de scan
Choisir l'événement, scanner le QR code (caméra) ou saisir le jeton. Cinq retours distincts (visuel et sonore) :
accepté (nom, prénom, profil), déjà utilisé (heure du premier scan), invalide, mauvais événement, événement annulé.
Le tableau « Temps réel » affiche entrées, billets restants et la liste des personnes entrées.
