// Types partagés, alignés sur les DTO du backend (records Java).

export type Role = 'PARTICIPANT' | 'ADMIN' | 'SCANNER'
export type TypeProfil = 'ETUDIANT' | 'VISITEUR' | 'AUCUN'

export interface PageResponse<T> {
  elements: T[]
  page: number
  taille: number
  totalElements: number
  totalPages: number
  premiere: boolean
  derniere: boolean
}

/** Erreur RFC 9457 renvoyée par l'API. */
export interface ProblemDetail {
  type?: string
  title?: string
  status: number
  detail?: string
  code?: string
  champs?: Record<string, string>
}

/** Événement tel que renvoyé par l'API (partagé par plusieurs features). */
export interface Evenement {
  id: number
  titre: string
  description: string | null
  dateDebut: string
  lieu: string | null
  prix: number
  devise: string
  capacite: number
  placesReservees: number
  placesRestantes: number
  statut: 'BROUILLON' | 'PUBLIE' | 'TERMINE' | 'ANNULE'
  aImage: boolean
  dateLimiteReservation?: string | null
  ventesSuspendues?: boolean
  ventesOuvertes?: boolean
  ambiance?: string | null
  couleurPrincipale?: string | null
  type?: 'EVENEMENT' | 'CADRE' | 'ACTIVITE' | 'PASS'
  parentId?: number | null
  dateFin?: string | null
  categorie?: string | null
  accesLibre?: boolean
  passPortee?: 'GLOBAL' | 'JOURNEE' | null
  passJour?: string | null
}

export interface ProfilResponse {
  id: number
  email: string
  emailVerifie: boolean
  telephone: string
  role: Role
  typeProfil: TypeProfil
  nom: string | null
  prenom: string | null
  creeLe: string
  etudiant: {
    filiereId: number
    filiereLibelle: string
    anneeInscriptionL1: number
    filiereModifiable: boolean
  } | null
  visiteur: {
    categorieId: number
    categorieCode: string
    categorieLibelle: string
    organisation: string | null
  } | null
}

export interface SessionResponse {
  accessToken: string
  expireDans: number
  utilisateurId: number
  role: Role
  emailVerifie: boolean
}
