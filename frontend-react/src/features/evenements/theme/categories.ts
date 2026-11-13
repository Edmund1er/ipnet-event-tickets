export type CleCategorie = 'SPORT' | 'CULTURE' | 'DANSE' | 'JEUX' | 'CONFERENCE' | 'SOIREE' | 'AUTRE'

interface Categorie {
  libelle: string
  couleur: string
  /** Nom d'icône Material Symbols. */
  icone: string
}

/** Chaque catégorie donne son visuel par défaut à une activité (couleur, icône) : l'admin n'a rien à régler. */
export const CATEGORIES: Record<CleCategorie, Categorie> = {
  SPORT: { libelle: 'Sport', couleur: '#16a34a', icone: 'sports_soccer' },
  CULTURE: { libelle: 'Culture', couleur: '#ea580c', icone: 'palette' },
  DANSE: { libelle: 'Danse', couleur: '#d946ef', icone: 'music_note' },
  JEUX: { libelle: 'Jeux', couleur: '#0891b2', icone: 'sports_esports' },
  CONFERENCE: { libelle: 'Conférence', couleur: '#1e3a8a', icone: 'co_present' },
  SOIREE: { libelle: 'Soirée', couleur: '#7c3aed', icone: 'nightlife' },
  AUTRE: { libelle: 'Autre', couleur: '#475569', icone: 'event' },
}

export const CLES_CATEGORIE = Object.keys(CATEGORIES) as CleCategorie[]

export function categorieDe(cle?: string | null): Categorie {
  return CATEGORIES[(cle as CleCategorie) ?? 'AUTRE'] ?? CATEGORIES.AUTRE
}
