import type { Role } from '../api/types'

/** Entrée de menu déclarée par une feature (architecture §4.2 : Sidebar dynamique). */
export interface EntreeNavigation {
  libelle: string
  chemin: string
  icone: string
  roles: Role[]
  groupe: 'Participant' | 'Administration' | 'Contrôle d\'accès' | 'Compte'
  ordre: number
}
