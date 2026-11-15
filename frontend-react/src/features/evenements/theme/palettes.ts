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
  couleurEntete: string | null
  couleurTexteEntete: string | null
  couleurFondPage: string | null
  couleurPied: string | null
  couleurTextePied: string | null
  couleurTexte: string | null
  couleurCarte: string | null
  couleurBouton: string | null
}

/** Combinaisons prêtes à l'emploi pour accorder boutons, accents et voile de bannière. */
export const PALETTES_PAGE: PalettePage[] = [
  { cle: 'modele', nom: 'Style natif du modèle', detail: 'Conserve les couleurs originales de la mise en page.', couleurPrincipale: null, couleurSecondaire: null, couleurBloc: null, opaciteBloc: 62, couleurEntete: null, couleurTexteEntete: null, couleurFondPage: null, couleurPied: null, couleurTextePied: null, couleurTexte: null, couleurCarte: null, couleurBouton: null },
  { cle: 'violet', nom: 'Violet de scène', detail: 'Violet profond, lavande et voile sombre.', couleurPrincipale: '#7c3aed', couleurSecondaire: '#c4b5fd', couleurBloc: '#21133b', opaciteBloc: 66, couleurEntete: '#21133b', couleurTexteEntete: '#ffffff', couleurFondPage: '#f8fafc', couleurPied: '#1e1b4b', couleurTextePied: '#ffffff', couleurTexte: '#1f2937', couleurCarte: '#ffffff', couleurBouton: '#7c3aed' },
  { cle: 'ocean', nom: 'Bleu océan', detail: 'Bleu vif, turquoise et bleu nuit.', couleurPrincipale: '#2563eb', couleurSecondaire: '#67e8f9', couleurBloc: '#082f49', opaciteBloc: 64, couleurEntete: '#082f49', couleurTexteEntete: '#ffffff', couleurFondPage: '#f1f8fc', couleurPied: '#082f49', couleurTextePied: '#ffffff', couleurTexte: '#172033', couleurCarte: '#ffffff', couleurBouton: '#2563eb' },
  { cle: 'emeraude', nom: 'Émeraude', detail: 'Vert profond, menthe et forêt.', couleurPrincipale: '#059669', couleurSecondaire: '#6ee7b7', couleurBloc: '#064e3b', opaciteBloc: 64, couleurEntete: '#064e3b', couleurTexteEntete: '#ffffff', couleurFondPage: '#f1faf6', couleurPied: '#064e3b', couleurTextePied: '#ffffff', couleurTexte: '#17352c', couleurCarte: '#ffffff', couleurBouton: '#047857' },
  { cle: 'ambre', nom: 'Ambre élégant', detail: 'Or chaud, ivoire et brun profond.', couleurPrincipale: '#b45309', couleurSecondaire: '#fcd34d', couleurBloc: '#451a03', opaciteBloc: 62, couleurEntete: '#451a03', couleurTexteEntete: '#ffffff', couleurFondPage: '#fffaf1', couleurPied: '#451a03', couleurTextePied: '#ffffff', couleurTexte: '#3f2d1d', couleurCarte: '#ffffff', couleurBouton: '#b45309' },
  { cle: 'rose', nom: 'Rose festif', detail: 'Rose soutenu, corail doux et prune.', couleurPrincipale: '#db2777', couleurSecondaire: '#f9a8d4', couleurBloc: '#500724', opaciteBloc: 66, couleurEntete: '#500724', couleurTexteEntete: '#ffffff', couleurFondPage: '#fff5fa', couleurPied: '#500724', couleurTextePied: '#ffffff', couleurTexte: '#3e2030', couleurCarte: '#ffffff', couleurBouton: '#be185d' },
  { cle: 'ardoise', nom: 'Ardoise moderne', detail: 'Ardoise, bleu clair et charbon.', couleurPrincipale: '#475569', couleurSecondaire: '#93c5fd', couleurBloc: '#0f172a', opaciteBloc: 68, couleurEntete: '#0f172a', couleurTexteEntete: '#ffffff', couleurFondPage: '#f5f7fa', couleurPied: '#0f172a', couleurTextePied: '#ffffff', couleurTexte: '#1f2937', couleurCarte: '#ffffff', couleurBouton: '#334155' },
]

/** Couleur stable d'un événement sans réglage : variée d'une carte à l'autre, jamais tirée au hasard à l'affichage. */
export function couleurParDefaut(id: number): string {
  return PALETTES[Math.abs(id) % PALETTES.length].couleur
}
