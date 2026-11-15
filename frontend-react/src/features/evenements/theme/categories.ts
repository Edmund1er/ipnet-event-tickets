export type CleCategorie = 'SPORT' | 'CULTURE' | 'DANSE' | 'JEUX' | 'CONFERENCE' | 'SOIREE' | 'RAP' | 'GOSPEL' | 'PLAGE' | 'NATURE' | 'DJ' | 'FESTIVAL' | 'AUTRE'

interface Categorie {
  libelle: string
  couleur: string
  /** Nom d'icône Material Symbols. */
  icone: string
}

/** Chaque catégorie donne son visuel par défaut à une activité (couleur, icône) : l'admin n'a rien à régler. */
export const CATEGORIES: Record<CleCategorie, Categorie> = {
  SPORT: { libelle: 'Tournoi sportif', couleur: '#16a34a', icone: 'sports_soccer' },
  CULTURE: { libelle: 'Festival culturel', couleur: '#ea580c', icone: 'palette' },
  DANSE: { libelle: 'Bal & danse', couleur: '#d946ef', icone: 'music_note' },
  JEUX: { libelle: 'E-sport & gaming', couleur: '#0891b2', icone: 'sports_esports' },
  CONFERENCE: { libelle: 'Concert / scène live', couleur: '#1e3a8a', icone: 'co_present' },
  SOIREE: { libelle: 'Soirée / club', couleur: '#7c3aed', icone: 'nightlife' },
  RAP: { libelle: 'Rap & urbain', couleur: '#db2777', icone: 'mic_external_on' },
  GOSPEL: { libelle: 'Gospel & louange', couleur: '#b45309', icone: 'church' },
  PLAGE: { libelle: 'Plage & beach day', couleur: '#06b6d4', icone: 'beach_access' },
  NATURE: { libelle: 'Nature & plein air', couleur: '#15803d', icone: 'park' },
  DJ: { libelle: 'DJ & électro', couleur: '#7c3aed', icone: 'album' },
  FESTIVAL: { libelle: 'Festival & live', couleur: '#ea580c', icone: 'festival' },
  AUTRE: { libelle: 'Autre fête', couleur: '#475569', icone: 'event' },
}

/** Nouvelles activités proposées : l'ancien code CONFERENCE reste affichable, mais n'est plus choisi. */
export const CLES_CATEGORIE: CleCategorie[] = ['SOIREE', 'RAP', 'GOSPEL', 'PLAGE', 'NATURE', 'DJ', 'FESTIVAL', 'SPORT', 'CULTURE', 'DANSE', 'JEUX', 'AUTRE']

export function categorieDe(cle?: string | null): Categorie {
  return CATEGORIES[(cle as CleCategorie) ?? 'AUTRE'] ?? CATEGORIES.AUTRE
}
