# Manuel utilisateur — IPNET Billetterie

## Participant (étudiant interne ou visiteur externe)
1. **Créer un compte** : « Créer un compte », choisir le profil, remplir nom, prénom, e-mail, téléphone, mot de passe
   (12 caractères minimum). Étudiant : filière et année d'inscription en L1 (listes). Visiteur : catégorie et organisation éventuelle.
   Aucune adresse postale n'est demandée.
2. **Valider l'e-mail** : un code à 6 chiffres est envoyé. Il est valable 5 minutes, 5 essais maximum. *Le compte n'est créé
   qu'une fois le code validé* ; sans validation, aucun accès. « Renvoyer un code » est possible toutes les 30 secondes.
3. **Réserver** : ouvrir un événement, « Réserver ». La place est retenue 48 h.
4. **Payer** : envoyer le montant au numéro Mobile Money affiché (bouton Copier), puis saisir la **référence de transaction**
   (obligatoire). Une capture d'écran JPG/PNG/PDF (5 Mo) est facultative.
5. **Billet** : après validation du paiement, le billet avec QR code arrive par e-mail et reste dans « Mes billets ».
6. **Profil** : modifier nom, prénom, téléphone ; changer d'e-mail (code envoyé à la nouvelle adresse) ; changer de filière
   tant que vous n'avez pas dépassé la L2 ; supprimer le compte.

## Administrateur
- **Événements** : création (titre, description, date et heure, lieu, prix, capacité, image choisie dès la création),
  publication, modification (tant qu'aucune réservation n'est confirmée), clôture, annulation (e-mail à chaque participant ;
  les paiements validés passent « À rembourser »).
- **Paiements** : file des références non rapprochées ; visualiser la capture, valider ou rejeter avec motif.
  **Import du relevé** (CSV `référence;montant;date`) : confirmation automatique quand référence et montant correspondent.
- **Participants et exports** : liste par événement, export des présents en CSV ou PDF.
- **Agents de scan** : créer et désactiver les comptes. **Audit** et **Notifications** (rejeu des envois en échec).
- **Paramètres** : numéro Mobile Money (ligne mobile valide) et bénéficiaire.

## Agent de scan
Choisir l'événement, scanner le QR code (caméra) ou saisir le jeton. Cinq retours distincts (visuel et sonore) :
accepté (nom, prénom, profil), déjà utilisé (heure du premier scan), invalide, mauvais événement, événement annulé.
Le tableau « Temps réel » affiche entrées, billets restants et la liste des personnes entrées.
