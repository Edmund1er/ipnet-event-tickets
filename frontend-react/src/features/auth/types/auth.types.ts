import type { TypeProfil } from '../../../core/api/types'

export interface Filiere {
  id: number
  libelle: string
}

export interface Categorie {
  id: number
  code: string
  libelle: string
}

export interface DemandeInscription {
  email: string
  telephone: string
  motDePasse: string
  typeProfil: Exclude<TypeProfil, 'AUCUN'>
  filiereId?: number
  anneeInscriptionL1?: number
  categorieId?: number
  organisation?: string
  nom: string
  prenom: string
}

/** Réponse à la demande d'inscription : aucun compte n'existe encore, aucune session n'est ouverte. */
export interface ReponseInscription {
  email: string
  codeValideMinutes: number
  message: string
}
