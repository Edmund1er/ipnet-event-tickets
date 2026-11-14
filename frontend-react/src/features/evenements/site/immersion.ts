import type { Immersion } from '../../../core/components/layout/Immersion'
import type { CleModele } from './types'

/** Couleurs de l'en-tête et du menu latéral pour chaque template (reprises des feuilles de style d'origine). */
export const COULEURS_MODELE: Record<CleModele, Pick<Immersion, 'fond' | 'texte' | 'accent' | 'surAccent' | 'bordure'>> = {
  SOIREE: { fond: '#050505', texte: '#ffffff', accent: '#ff4533', surAccent: '#ffffff', bordure: 'rgba(255,255,255,.14)' },
  CONFERENCE: { fond: '#0e1b4d', texte: '#ffffff', accent: '#f82249', surAccent: '#ffffff', bordure: 'rgba(255,255,255,.14)' },
  RENCONTRE: { fond: 'linear-gradient(180deg,#ff8a00 0%,#d4249a 55%,#6d3df0 100%)', texte: '#ffffff', accent: '#ffffff', surAccent: '#9d1fa6', bordure: 'rgba(255,255,255,.25)' },
  CEREMONIE: { fond: '#ffffff', texte: '#262626', accent: '#ff6600', surAccent: '#ffffff', bordure: '#e5e5e5' },
}
