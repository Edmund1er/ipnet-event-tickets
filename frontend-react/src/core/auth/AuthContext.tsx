import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { http, rafraichirSession, sessionMemoire } from '../api/httpClient'
import type { ProfilResponse, Role, SessionResponse } from '../api/types'

interface EtatAuth {
  chargement: boolean
  session: SessionResponse | null
  profil: ProfilResponse | null
  role: Role | null
  /** Ouvre la session à partir d'une réponse de connexion / inscription. */
  ouvrir: (s: SessionResponse) => Promise<void>
  fermer: () => Promise<void>
  rechargerProfil: () => Promise<void>
}

const Contexte = createContext<EtatAuth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [chargement, setChargement] = useState(true)
  const [session, setSession] = useState<SessionResponse | null>(null)
  const [profil, setProfil] = useState<ProfilResponse | null>(null)

  const chargerProfil = useCallback(async () => {
    const r = await http.get<ProfilResponse>('/profil/moi')
    setProfil(r.data)
  }, [])

  const ouvrir = useCallback(
    async (s: SessionResponse) => {
      sessionMemoire.definir(s.accessToken)
      setSession(s)
      await chargerProfil()
    },
    [chargerProfil],
  )

  const fermer = useCallback(async () => {
    try {
      await http.post('/auth/deconnexion')
    } finally {
      sessionMemoire.definir(null)
      setSession(null)
      setProfil(null)
    }
  }, [])

  // Restauration de la session au chargement de la page (cookie HttpOnly de rafraîchissement)
  useEffect(() => {
    sessionMemoire.surRenouvellement((s) => setSession(s))
    sessionMemoire.surPerte(() => {
      setSession(null)
      setProfil(null)
    })
    let actif = true
    rafraichirSession()
      .then(async (s) => {
        if (s && actif) {
          setSession(s)
          await chargerProfil().catch(() => undefined)
        }
      })
      .finally(() => actif && setChargement(false))
    return () => {
      actif = false
    }
  }, [chargerProfil])

  const valeur = useMemo<EtatAuth>(
    () => ({
      chargement,
      session,
      profil,
      role: session?.role ?? null,
      ouvrir,
      fermer,
      rechargerProfil: chargerProfil,
    }),
    [chargement, session, profil, ouvrir, fermer, chargerProfil],
  )

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): EtatAuth {
  const ctx = useContext(Contexte)
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return ctx
}
