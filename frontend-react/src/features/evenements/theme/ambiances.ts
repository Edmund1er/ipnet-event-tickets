import type { CSSProperties } from 'react'
import type { Evenement } from '../../../core/api/types'
import { couleurParDefaut } from './palettes'

export type CleAmbiance = 'SOBRE' | 'ACADEMIQUE' | 'CEREMONIE' | 'SOIREE' | 'SPORT' | 'CULTURE' | 'FESTIF' | 'PLAGE' | 'NATURE' | 'URBAIN' | 'GOSPEL' | 'ELECTRO' | 'FESTIVAL'

interface Ambiance {
  libelle: string
  /** Couleur proposée tant que l'admin n'en choisit pas une. */
  couleur: string
  /** Fond sombre ou clair du bandeau (sans photo). */
  sombre: boolean
  /** Motif SVG léger, répété par-dessus le dégradé. */
  motif: string
}

const svg = (corps: string, t = 48) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${t}' height='${t}' viewBox='0 0 ${t} ${t}'>${corps}</svg>`,
  )}")`

export const AMBIANCES: Record<CleAmbiance, Ambiance> = {
  SOBRE: { libelle: 'Sobre', couleur: '#2563eb', sombre: true, motif: svg("<circle cx='4' cy='4' r='1.5' fill='white' fill-opacity='.12'/>", 24) },
  ACADEMIQUE: { libelle: 'Classique', couleur: '#1e3a8a', sombre: true, motif: svg("<path d='M0 24h48M24 0v48' stroke='white' stroke-opacity='.07'/>") },
  CEREMONIE: { libelle: 'Cérémonie', couleur: '#b8860b', sombre: true, motif: svg("<path d='M24 6l6 12-6 12-6-12z' fill='none' stroke='white' stroke-opacity='.14'/>") },
  SOIREE: { libelle: 'Soirée', couleur: '#d946ef', sombre: true, motif: svg("<path d='M0 40L40 0M8 48L48 8' stroke='white' stroke-opacity='.12' stroke-width='2'/>") },
  SPORT: { libelle: 'Sport', couleur: '#16a34a', sombre: true, motif: svg("<path d='M-4 52L52 -4M12 52L52 12M-4 36L36 -4' stroke='white' stroke-opacity='.13' stroke-width='3'/>") },
  CULTURE: { libelle: 'Culture', couleur: '#ea580c', sombre: true, motif: svg("<path d='M0 12l12-12 12 12-12 12zM24 36l12-12 12 12-12 12z' fill='white' fill-opacity='.1'/>") },
  FESTIF: { libelle: 'Fête & rencontres', couleur: '#e11d48', sombre: true, motif: svg("<circle cx='10' cy='12' r='3' fill='white' fill-opacity='.18'/><rect x='32' y='30' width='6' height='6' fill='white' fill-opacity='.15' transform='rotate(25 35 33)'/>") },
  PLAGE: { libelle: 'Plage & beach day', couleur: '#06b6d4', sombre: false, motif: svg("<path d='M0 32 Q12 24 24 32 T48 32M0 40 Q12 32 24 40 T48 40' fill='none' stroke='white' stroke-opacity='.18' stroke-width='2'/>") },
  NATURE: { libelle: 'Nature & plein air', couleur: '#15803d', sombre: true, motif: svg("<path d='M24 6c10 1 17 8 18 18-10 0-17-7-18-18ZM24 16c-9 1-15 7-16 16 9 0 15-6 16-16ZM24 17v25' fill='none' stroke='white' stroke-opacity='.16' stroke-width='2'/>") },
  URBAIN: { libelle: 'Rap & urbain', couleur: '#7c3aed', sombre: true, motif: svg("<path d='M0 40L40 0M12 52L52 12' stroke='white' stroke-opacity='.13' stroke-width='3'/>") },
  GOSPEL: { libelle: 'Gospel & louange', couleur: '#b45309', sombre: true, motif: svg("<path d='M24 8v32M8 24h32' stroke='white' stroke-opacity='.12' stroke-width='3'/>") },
  ELECTRO: { libelle: 'DJ & électro', couleur: '#db2777', sombre: true, motif: svg("<circle cx='24' cy='24' r='16' fill='none' stroke='white' stroke-opacity='.15'/><circle cx='24' cy='24' r='5' fill='white' fill-opacity='.18'/>") },
  FESTIVAL: { libelle: 'Festival & live', couleur: '#ea580c', sombre: true, motif: svg("<path d='M0 12h48M0 24h48M0 36h48' stroke='white' stroke-opacity='.09'/><circle cx='12' cy='12' r='3' fill='white' fill-opacity='.15'/><circle cx='36' cy='36' r='3' fill='white' fill-opacity='.18'/>") },
}

export const CLES_AMBIANCE: CleAmbiance[] = ['SOIREE', 'PLAGE', 'NATURE', 'URBAIN', 'GOSPEL', 'ELECTRO', 'FESTIVAL', 'CEREMONIE', 'SPORT', 'CULTURE', 'SOBRE']
export const COULEUR_DEFAUT = '#2563eb'

const AMBIANCE_PAR_MODELE: Partial<Record<string, CleAmbiance>> = {
  SOIREE: 'SOIREE', CONFERENCE: 'URBAIN', RENCONTRE: 'PLAGE', CEREMONIE: 'CEREMONIE',
  ATELIER: 'NATURE', TOURNOI: 'SPORT', SALON: 'GOSPEL', RESEAUTAGE: 'ELECTRO',
  LAGON: 'PLAGE', FORET: 'NATURE', FORUM: 'CULTURE',
}

export function ambiancePourModele(modele?: string | null): CleAmbiance | undefined {
  return modele ? AMBIANCE_PAR_MODELE[modele] : undefined
}

export const estHex = (c?: string | null): c is string => !!c && /^#[0-9a-fA-F]{6}$/.test(c)

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Choisit le premier plan qui offre le meilleur contraste WCAG parmi le texte sombre ou blanc. */
export function texteSur(hex: string) {
  const fond = luminance(hex)
  const contraste = (l: number) => (Math.max(fond, l) + 0.05) / (Math.min(fond, l) + 0.05)
  return contraste(luminance('#111827')) >= contraste(luminance('#ffffff')) ? '#111827' : '#ffffff'
}

function assombrir(hex: string, k: number) {
  const c = [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * k))
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

export function ambianceDe(cle?: string | null): Ambiance {
  return AMBIANCES[(cle as CleAmbiance) ?? 'SOBRE'] ?? AMBIANCES.SOBRE
}

/** Variables CSS appliquées uniquement sur la page de l'événement. */
export function themeEvenement(cle?: string | null, couleur?: string | null): CSSProperties {
  const a = ambianceDe(cle)
  const primaire = estHex(couleur) ? couleur : a.couleur
  return {
    // Les couleurs « rouge » de la plateforme sont redéfinies localement : toute la page de l'événement suit.
    '--color-rouge': primaire,
    '--color-rouge-fonce': assombrir(primaire, 0.85),
    '--ev-primaire': primaire,
    '--ev-sur-primaire': texteSur(primaire),
    '--ev-fonce': assombrir(primaire, 0.55),
    '--ev-motif': a.motif,
  } as CSSProperties
}

/** Thème d'un événement : sa couleur, sinon celle de son ambiance, sinon une couleur stable propre à l'événement. */
export function themeDe(e: Pick<Evenement, 'id' | 'ambiance' | 'couleurPrincipale'> & Partial<Pick<Evenement, 'modele'>>): CSSProperties {
  const ambiance = e.ambiance ?? ambiancePourModele(e.modele)
  return themeEvenement(ambiance, e.couleurPrincipale ?? (ambiance ? null : couleurParDefaut(e.id)))
}
