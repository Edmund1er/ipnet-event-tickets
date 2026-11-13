/** Couleurs proposées à l'administrateur : une liste choisie, lisible avec du texte blanc, avant le sélecteur libre. */
export interface Palette {
  cle: string
  nom: string
  couleur: string
}

export const PALETTES: Palette[] = [
  { cle: 'indigo', nom: 'Indigo', couleur: '#4f46e5' },
  { cle: 'bleu', nom: 'Bleu', couleur: '#2563eb' },
  { cle: 'turquoise', nom: 'Turquoise', couleur: '#0d9488' },
  { cle: 'emeraude', nom: 'Émeraude', couleur: '#059669' },
  { cle: 'ambre', nom: 'Ambre', couleur: '#b45309' },
  { cle: 'orange', nom: 'Orange', couleur: '#ea580c' },
  { cle: 'rouge', nom: 'Rouge', couleur: '#dc2626' },
  { cle: 'rose', nom: 'Rose', couleur: '#db2777' },
  { cle: 'violet', nom: 'Violet', couleur: '#7c3aed' },
  { cle: 'ardoise', nom: 'Ardoise', couleur: '#475569' },
  { cle: 'nuit', nom: 'Nuit', couleur: '#1e293b' },
  { cle: 'or', nom: 'Or', couleur: '#a16207' },
]

/** Couleur stable d'un événement sans réglage : variée d'une carte à l'autre, jamais tirée au hasard à l'affichage. */
export function couleurParDefaut(id: number): string {
  return PALETTES[Math.abs(id) % PALETTES.length].couleur
}

export type CleModele = 'CLASSIQUE' | 'AFFICHE' | 'MAGAZINE' | 'EPURE'

export const MODELES: { cle: CleModele; nom: string; description: string }[] = [
  { cle: 'CLASSIQUE', nom: 'Classique', description: 'Grande bannière, texte à gauche, réservation à droite.' },
  { cle: 'AFFICHE', nom: 'Affiche', description: 'Visuel d’un côté, informations et réservation de l’autre.' },
  { cle: 'MAGAZINE', nom: 'Magazine', description: 'Titre centré, image large, lecture en colonne.' },
  { cle: 'EPURE', nom: 'Épuré', description: 'Sobre et rapide, idéal quand il y a peu de contenu.' },
]
