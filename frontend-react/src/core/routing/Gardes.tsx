import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import type { Role } from '../api/types'
import { ChargementPage } from '../components/ui/Chargement'

/**
 * Garde de route (§9 du cahier) : le rôle est lu depuis la session pour l'affichage,
 * la décision finale reste côté serveur.
 */
export function RequireRole({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const { chargement, session } = useAuth()
  const location = useLocation()
  if (chargement) return <ChargementPage />
  if (!session) return <Navigate to="/connexion" replace state={{ depuis: location.pathname + location.search }} />
  // RG-01 : tant que l'adresse e-mail n'est pas confirmée, seule la vérification (et le profil) est accessible
  if (!session.emailVerifie && !['/verification', '/profil'].includes(location.pathname)) {
    return <Navigate to="/verification" replace />
  }
  if (roles && !roles.includes(session.role)) return <Navigate to={accueilPour(session.role)} replace />
  return <>{children}</>
}

/** Pages réservées aux visiteurs non connectés (connexion, inscription…). */
export function RequireAnonyme({ children }: { children: ReactNode }) {
  const { chargement, session } = useAuth()
  if (chargement) return <ChargementPage />
  if (session) return <Navigate to={accueilPour(session.role)} replace />
  return <>{children}</>
}

// eslint-disable-next-line react-refresh/only-export-components
export function accueilPour(role: Role): string {
  if (role === 'ADMIN') return '/admin'
  if (role === 'SCANNER') return '/controle/scanner'
  return '/'
}
