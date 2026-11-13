import type { CSSProperties } from 'react'
import type { Evenement } from '../../../core/api/types'
import { couleurParDefaut } from './palettes'

export type CleAmbiance = 'SOBRE' | 'ACADEMIQUE' | 'CEREMONIE' | 'SOIREE' | 'SPORT' | 'CULTURE' | 'FESTIF'

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
  ACADEMIQUE: { libelle: 'Académique', couleur: '#1e3a8a', sombre: true, motif: svg("<path d='M0 24h48M24 0v48' stroke='white' stroke-opacity='.07'/>") },
  CEREMONIE: { libelle: 'Cérémonie', couleur: '#b8860b', sombre: true, motif: svg("<path d='M24 6l6 12-6 12-6-12z' fill='none' stroke='white' stroke-opacity='.14'/>") },
  SOIREE: { libelle: 'Soirée', couleur: '#d946ef', sombre: true, motif: svg("<path d='M0 40L40 0M8 48L48 8' stroke='white' stroke-opacity='.12' stroke-width='2'/>") },
  SPORT: { libelle: 'Sport', couleur: '#16a34a', sombre: true, motif: svg("<path d='M-4 52L52 -4M12 52L52 12M-4 36L36 -4' stroke='white' stroke-opacity='.13' stroke-width='3'/>") },
  CULTURE: { libelle: 'Culture', couleur: '#ea580c', sombre: true, motif: svg("<path d='M0 12l12-12 12 12-12 12zM24 36l12-12 12 12-12 12z' fill='white' fill-opacity='.1'/>") },
  FESTIF: { libelle: 'Festif', couleur: '#e11d48', sombre: true, motif: svg("<circle cx='10' cy='12' r='3' fill='white' fill-opacity='.18'/><rect x='32' y='30' width='6' height='6' fill='white' fill-opacity='.15' transform='rotate(25 35 33)'/>") },
}

export const CLES_AMBIANCE = Object.keys(AMBIANCES) as CleAmbiance[]
export const COULEUR_DEFAUT = '#2563eb'

const estHex = (c?: string | null): c is string => !!c && /^#[0-9a-fA-F]{6}$/.test(c)

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Noir ou blanc selon la couleur de fond, pour garder un texte toujours lisible (WCAG). */
export function texteSur(hex: string) {
  return luminance(hex) > 0.35 ? '#111827' : '#ffffff'
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
export function themeDe(e: Pick<Evenement, 'id' | 'ambiance' | 'couleurPrincipale'>): CSSProperties {
  return themeEvenement(e.ambiance, e.couleurPrincipale ?? (e.ambiance ? null : couleurParDefaut(e.id)))
}
