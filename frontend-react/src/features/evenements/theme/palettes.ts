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
  { cle: 'modele', nom: 'Style original', detail: 'Garde l’identité visuelle du modèle choisi.', couleurPrincipale: null, couleurSecondaire: null, couleurBloc: null, opaciteBloc: 62, couleurEntete: null, couleurTexteEntete: null, couleurFondPage: null, couleurPied: null, couleurTextePied: null, couleurTexte: null, couleurCarte: null, couleurBouton: null },
  { cle: 'electro', nom: 'Néon électro', detail: 'Fuchsia, cyan et nuit club.', couleurPrincipale: '#e879f9', couleurSecondaire: '#22d3ee', couleurBloc: '#16051f', opaciteBloc: 76, couleurEntete: '#100713', couleurTexteEntete: '#ffffff', couleurFondPage: '#100b15', couleurPied: '#100713', couleurTextePied: '#ffffff', couleurTexte: '#f8efff', couleurCarte: '#211729', couleurBouton: '#d946ef' },
  { cle: 'plage', nom: 'Plage — soleil & lagon', detail: 'Turquoise vif, corail et lumière de beach day.', couleurPrincipale: '#06b6d4', couleurSecondaire: '#fb923c', couleurBloc: '#062a36', opaciteBloc: 72, couleurEntete: '#075b70', couleurTexteEntete: '#ffffff', couleurFondPage: '#07313d', couleurPied: '#06232d', couleurTextePied: '#ffffff', couleurTexte: '#f0fdff', couleurCarte: '#104554', couleurBouton: '#06b6d4' },
  { cle: 'nature', nom: 'Nature — forêt & plein air', detail: 'Vert feuille, sable chaud et balade au grand air.', couleurPrincipale: '#84cc16', couleurSecondaire: '#f97316', couleurBloc: '#172b1d', opaciteBloc: 72, couleurEntete: '#183321', couleurTexteEntete: '#ffffff', couleurFondPage: '#14271a', couleurPied: '#112318', couleurTextePied: '#ffffff', couleurTexte: '#f7fee7', couleurCarte: '#20372a', couleurBouton: '#65a30d' },
  { cle: 'urbain', nom: 'Rap & urbain', detail: 'Rouge scène, orange chaud et fond encre.', couleurPrincipale: '#fb456a', couleurSecondaire: '#fb923c', couleurBloc: '#1f1024', opaciteBloc: 76, couleurEntete: '#110b12', couleurTexteEntete: '#ffffff', couleurFondPage: '#120d12', couleurPied: '#110b12', couleurTextePied: '#ffffff', couleurTexte: '#fff3f0', couleurCarte: '#24161c', couleurBouton: '#e11d48' },
  { cle: 'gospel', nom: 'Gospel live', detail: 'Or lumineux, ivoire et bleu profond.', couleurPrincipale: '#fbbf24', couleurSecondaire: '#fde68a', couleurBloc: '#1e1b4b', opaciteBloc: 74, couleurEntete: '#17140d', couleurTexteEntete: '#ffffff', couleurFondPage: '#15120d', couleurPied: '#17140d', couleurTextePied: '#ffffff', couleurTexte: '#fff9e8', couleurCarte: '#272114', couleurBouton: '#b45309' },
  { cle: 'bal', nom: 'Bal & gala', detail: 'Prune profonde, or chaud et lumière de scène.', couleurPrincipale: '#f0abfc', couleurSecondaire: '#fbbf24', couleurBloc: '#2b1027', opaciteBloc: 74, couleurEntete: '#160d18', couleurTexteEntete: '#ffffff', couleurFondPage: '#130e16', couleurPied: '#160d18', couleurTextePied: '#ffffff', couleurTexte: '#fff5fb', couleurCarte: '#241723', couleurBouton: '#c026d3' },
  { cle: 'festival', nom: 'Festival & live', detail: 'Violet scène, vert citron et énergie.', couleurPrincipale: '#a78bfa', couleurSecondaire: '#bef264', couleurBloc: '#1f1235', opaciteBloc: 76, couleurEntete: '#100d16', couleurTexteEntete: '#ffffff', couleurFondPage: '#100d16', couleurPied: '#100d16', couleurTextePied: '#ffffff', couleurTexte: '#f7f4ff', couleurCarte: '#211b31', couleurBouton: '#7c3aed' },
]

/** Couleur stable d'un événement sans réglage : variée d'une carte à l'autre, jamais tirée au hasard à l'affichage. */
export function couleurParDefaut(id: number): string {
  return PALETTES[Math.abs(id) % PALETTES.length].couleur
}
