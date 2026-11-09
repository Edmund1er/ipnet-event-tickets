import { rafraichirSession, sessionMemoire } from '../../../core/api/httpClient'

export type EtatFlux = 'connexion' | 'connecte' | 'reconnexion'

/**
 * Flux temps réel des statistiques (SSE). EventSource ne pouvant pas envoyer d'en-tête,
 * le jeton d'accès est passé en paramètre (accepté par l'API uniquement sur cette route).
 * En cas de coupure (ou jeton expiré), la session est rafraîchie puis le flux rouvert.
 */
export function ouvrirFlux<T>(evenementId: number, surDonnees: (d: T) => void, surEtat: (e: EtatFlux) => void): () => void {
  let source: EventSource | null = null
  let ferme = false
  let minuterie: ReturnType<typeof setTimeout> | null = null

  const connecter = () => {
    if (ferme) return
    const jeton = sessionMemoire.lire()
    if (!jeton) {
      surEtat('reconnexion')
      void rafraichirSession().then(() => (minuterie = setTimeout(connecter, 1000)))
      return
    }
    source = new EventSource(`/api/scan/evenements/${evenementId}/flux?access_token=${encodeURIComponent(jeton)}`)
    source.addEventListener('open', () => surEtat('connecte'))
    source.addEventListener('statistiques', (e) => {
      surEtat('connecte')
      surDonnees(JSON.parse((e as MessageEvent).data) as T)
    })
    source.addEventListener('error', () => {
      source?.close()
      source = null
      if (ferme) return
      surEtat('reconnexion')
      void rafraichirSession().finally(() => {
        minuterie = setTimeout(connecter, 3000)
      })
    })
  }

  surEtat('connexion')
  connecter()
  return () => {
    ferme = true
    if (minuterie) clearTimeout(minuterie)
    source?.close()
  }
}
