import type { ResultatScan } from '../../../core/constants/statuts'

/** Retour visuel et sonore distinct pour chacun des cinq résultats (§9 du cahier, maquette). */
export const PRESENTATION_RESULTAT: Record<ResultatScan, { titre: string; icone: string; fond: string }> = {
  ACCEPTE: { titre: 'ACCÈS AUTORISÉ', icone: 'check_circle', fond: 'bg-succes' },
  DEJA_UTILISE: { titre: 'BILLET DÉJÀ UTILISÉ', icone: 'history', fond: 'bg-alerte' },
  INVALIDE: { titre: 'BILLET INVALIDE', icone: 'cancel', fond: 'bg-erreur' },
  MAUVAIS_EVENEMENT: { titre: 'MAUVAIS ÉVÉNEMENT', icone: 'wrong_location', fond: 'bg-mauvais' },
  EVENEMENT_ANNULE: { titre: 'ÉVÉNEMENT ANNULÉ', icone: 'event_busy', fond: 'bg-annule' },
}

const SONS: Record<ResultatScan, { freq: number; duree: number }[]> = {
  ACCEPTE: [{ freq: 880, duree: 0.12 }, { freq: 1320, duree: 0.16 }],
  DEJA_UTILISE: [{ freq: 520, duree: 0.18 }, { freq: 520, duree: 0.18 }],
  INVALIDE: [{ freq: 220, duree: 0.45 }],
  MAUVAIS_EVENEMENT: [{ freq: 330, duree: 0.15 }, { freq: 260, duree: 0.3 }],
  EVENEMENT_ANNULE: [{ freq: 180, duree: 0.2 }, { freq: 180, duree: 0.2 }, { freq: 180, duree: 0.2 }],
}

let contexte: AudioContext | null = null

export function jouerSon(resultat: ResultatScan) {
  try {
    contexte ??= new AudioContext()
    let t = contexte.currentTime
    for (const { freq, duree } of SONS[resultat]) {
      const osc = contexte.createOscillator()
      const gain = contexte.createGain()
      osc.type = resultat === 'ACCEPTE' ? 'sine' : 'square'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.18, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + duree)
      osc.connect(gain).connect(contexte.destination)
      osc.start(t)
      osc.stop(t + duree)
      t += duree + 0.06
    }
    navigator.vibrate?.(resultat === 'ACCEPTE' ? 80 : [120, 60, 120])
  } catch {
    /* audio indisponible : le retour visuel suffit */
  }
}
