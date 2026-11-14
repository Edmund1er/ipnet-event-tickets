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

export interface PalettePage {
  cle: string
  nom: string
  detail: string
  couleurPrincipale: string | null
  couleurSecondaire: string | null
  couleurBloc: string | null
  opaciteBloc: number
}

/** Combinaisons prêtes à l'emploi pour accorder boutons, accents et voile de bannière. */
export const PALETTES_PAGE: PalettePage[] = [
  { cle: 'modele', nom: 'Couleurs du style choisi', detail: 'Garde les couleurs harmonisées du type de page.', couleurPrincipale: null, couleurSecondaire: null, couleurBloc: null, opaciteBloc: 62 },
  { cle: 'violet', nom: 'Violet de scène', detail: 'Violet profond, lavande et voile sombre.', couleurPrincipale: '#7c3aed', couleurSecondaire: '#c4b5fd', couleurBloc: '#21133b', opaciteBloc: 66 },
  { cle: 'ocean', nom: 'Bleu océan', detail: 'Bleu vif, turquoise et bleu nuit.', couleurPrincipale: '#2563eb', couleurSecondaire: '#67e8f9', couleurBloc: '#082f49', opaciteBloc: 64 },
  { cle: 'emeraude', nom: 'Émeraude', detail: 'Vert profond, menthe et forêt.', couleurPrincipale: '#059669', couleurSecondaire: '#6ee7b7', couleurBloc: '#064e3b', opaciteBloc: 64 },
  { cle: 'ambre', nom: 'Ambre élégant', detail: 'Or chaud, ivoire et brun profond.', couleurPrincipale: '#b45309', couleurSecondaire: '#fcd34d', couleurBloc: '#451a03', opaciteBloc: 62 },
  { cle: 'rose', nom: 'Rose festif', detail: 'Rose soutenu, corail doux et prune.', couleurPrincipale: '#db2777', couleurSecondaire: '#f9a8d4', couleurBloc: '#500724', opaciteBloc: 66 },
  { cle: 'ardoise', nom: 'Ardoise moderne', detail: 'Ardoise, bleu clair et charbon.', couleurPrincipale: '#475569', couleurSecondaire: '#93c5fd', couleurBloc: '#0f172a', opaciteBloc: 68 },
]

/** Couleur stable d'un événement sans réglage : variée d'une carte à l'autre, jamais tirée au hasard à l'affichage. */
export function couleurParDefaut(id: number): string {
  return PALETTES[Math.abs(id) % PALETTES.length].couleur
}
