export type StatutEvenement = 'BROUILLON' | 'PUBLIE' | 'TERMINE' | 'ANNULE'
export type StatutInscription =
  | 'EN_ATTENTE_PAIEMENT'
  | 'PREUVE_ENVOYEE'
  | 'REJETEE'
  | 'CONFIRMEE'
  | 'ANNULEE'
  | 'EXPIREE'
export type StatutPaiement = 'EN_ATTENTE' | 'VALIDE' | 'REJETE' | 'A_REMBOURSER' | 'REMBOURSE'
export type StatutOutbox = 'EN_ATTENTE' | 'ENVOYEE' | 'ECHEC'
export type ResultatScan = 'ACCEPTE' | 'DEJA_UTILISE' | 'INVALIDE' | 'MAUVAIS_EVENEMENT' | 'EVENEMENT_ANNULE'

export type Ton = 'bleu' | 'vert' | 'orange' | 'rouge' | 'gris' | 'violet'

interface DefStatut {
  libelle: string
  ton: Ton
}

export const STATUTS_EVENEMENT: Record<StatutEvenement, DefStatut> = {
  BROUILLON: { libelle: 'Brouillon', ton: 'gris' },
  PUBLIE: { libelle: 'Publié', ton: 'vert' },
  TERMINE: { libelle: 'Terminé', ton: 'bleu' },
  ANNULE: { libelle: 'Annulé', ton: 'rouge' },
}

export const STATUTS_INSCRIPTION: Record<StatutInscription, DefStatut> = {
  EN_ATTENTE_PAIEMENT: { libelle: 'En attente de paiement', ton: 'orange' },
  PREUVE_ENVOYEE: { libelle: 'Paiement en vérification', ton: 'bleu' },
  REJETEE: { libelle: 'Paiement rejeté', ton: 'rouge' },
  CONFIRMEE: { libelle: 'Confirmée', ton: 'vert' },
  ANNULEE: { libelle: 'Annulée', ton: 'gris' },
  EXPIREE: { libelle: 'Expirée', ton: 'gris' },
}

export const STATUTS_PAIEMENT: Record<StatutPaiement, DefStatut> = {
  EN_ATTENTE: { libelle: 'À traiter', ton: 'orange' },
  VALIDE: { libelle: 'Validé', ton: 'vert' },
  REJETE: { libelle: 'Rejeté', ton: 'rouge' },
  A_REMBOURSER: { libelle: 'À rembourser', ton: 'violet' },
  REMBOURSE: { libelle: 'Remboursé', ton: 'gris' },
}

export const STATUTS_OUTBOX: Record<StatutOutbox, DefStatut> = {
  EN_ATTENTE: { libelle: 'En file', ton: 'orange' },
  ENVOYEE: { libelle: 'Envoyée', ton: 'vert' },
  ECHEC: { libelle: 'Échec', ton: 'rouge' },
}

export const MODELES_NOTIFICATION: Record<string, string> = {
  OTP: 'Code de vérification',
  BILLET_EMIS: 'Billet émis',
  PREUVE_REJETEE: 'Paiement rejeté',
  EVENEMENT_ANNULE: 'Événement annulé',
  RESET_MOT_DE_PASSE: 'Réinitialisation du mot de passe',
  ALERTE_ECHEC_ENVOI: 'Alerte administrateur',
}

export const ROLES: Record<string, string> = {
  PARTICIPANT: 'Participant',
  ADMIN: 'Administrateur',
  SCANNER: 'Agent de scan',
}
