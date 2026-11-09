import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import type { ProblemDetail, SessionResponse } from './types'

/**
 * Client HTTP unique.
 * - Le jeton d'accès (15 min) est gardé en mémoire uniquement (jamais en localStorage).
 * - Le refresh token est un cookie HttpOnly posé par l'API : sur 401, une seule requête
 *   de rafraîchissement est faite puis les requêtes en échec sont rejouées.
 */

let jetonAcces: string | null = null
let surSessionRenouvelee: ((s: SessionResponse) => void) | null = null
let surSessionPerdue: (() => void) | null = null
let rafraichissementEnCours: Promise<SessionResponse | null> | null = null

export const sessionMemoire = {
  definir(jeton: string | null) {
    jetonAcces = jeton
  },
  lire() {
    return jetonAcces
  },
  surRenouvellement(cb: (s: SessionResponse) => void) {
    surSessionRenouvelee = cb
  },
  surPerte(cb: () => void) {
    surSessionPerdue = cb
  },
}

export const http = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { Accept: 'application/json' },
})

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (jetonAcces && !config.headers.has('Authorization')) {
    config.headers.set('Authorization', `Bearer ${jetonAcces}`)
  }
  return config
})

/** Rafraîchit la session via le cookie (une seule requête simultanée). */
export function rafraichirSession(): Promise<SessionResponse | null> {
  if (!rafraichissementEnCours) {
    rafraichissementEnCours = axios
      .post<SessionResponse>('/api/auth/rafraichir', null, { withCredentials: true })
      .then((r) => {
        jetonAcces = r.data.accessToken
        surSessionRenouvelee?.(r.data)
        return r.data
      })
      .catch(() => {
        jetonAcces = null
        return null
      })
      .finally(() => {
        rafraichissementEnCours = null
      })
  }
  return rafraichissementEnCours
}

const ROUTES_SANS_REJEU = ['/auth/connexion', '/auth/rafraichir', '/auth/inscription', '/auth/deconnexion']

http.interceptors.response.use(
  (r) => r,
  async (erreur: AxiosError) => {
    const config = erreur.config as (AxiosRequestConfig & { _rejoue?: boolean }) | undefined
    const url = config?.url ?? ''
    if (
      erreur.response?.status === 401 &&
      config &&
      !config._rejoue &&
      !ROUTES_SANS_REJEU.some((r) => url.startsWith(r))
    ) {
      config._rejoue = true
      const session = await rafraichirSession()
      if (session) {
        config.headers = { ...(config.headers ?? {}), Authorization: `Bearer ${session.accessToken}` }
        return http(config)
      }
      surSessionPerdue?.()
    }
    return Promise.reject(erreur)
  },
)

/** Erreur normalisée pour l'affichage. */
export class ErreurApi extends Error {
  readonly status: number
  readonly code?: string
  readonly champs?: Record<string, string>

  constructor(p: ProblemDetail) {
    super(p.detail || p.title || 'Une erreur est survenue')
    this.status = p.status
    this.code = p.code
    this.champs = p.champs
  }
}

export function versErreurApi(e: unknown): ErreurApi {
  if (e instanceof ErreurApi) return e
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as ProblemDetail | undefined
    if (data && typeof data === 'object' && 'status' in data) return new ErreurApi(data)
    if (!e.response) {
      return new ErreurApi({ status: 0, detail: 'Serveur injoignable. Vérifiez votre connexion.' })
    }
    return new ErreurApi({ status: e.response.status, detail: 'Une erreur est survenue' })
  }
  return new ErreurApi({ status: 0, detail: e instanceof Error ? e.message : 'Une erreur est survenue' })
}

export function messageErreur(e: unknown): string {
  return versErreurApi(e).message
}

/** Récupère une ressource binaire protégée (QR, capture…) sous forme d'URL locale. */
export async function urlBlob(chemin: string): Promise<string> {
  const r = await http.get<Blob>(chemin, { responseType: 'blob' })
  return URL.createObjectURL(r.data)
}

/** Télécharge un fichier renvoyé par l'API (export CSV/PDF…). */
export async function telecharger(chemin: string, nomParDefaut: string, params?: Record<string, string>) {
  const r = await http.get<Blob>(chemin, { responseType: 'blob', params })
  const dispo = r.headers['content-disposition'] as string | undefined
  const nom = dispo?.match(/filename="?([^"]+)"?/)?.[1] ?? nomParDefaut
  const url = URL.createObjectURL(r.data)
  const a = document.createElement('a')
  a.href = url
  a.download = nom
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
