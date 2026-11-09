import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { http } from '../api/httpClient'
import { ChargementPage } from '../components/ui/Chargement'

/**
 * Premier lancement : tant qu'aucun administrateur n'existe, toutes les pages redirigent vers /installation.
 */
export function GardeInstallation({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [requise, setRequise] = useState<boolean | null>(null)

  useEffect(() => {
    let actif = true
    http
      .get<{ installationRequise: boolean }>('/installation')
      .then((r) => actif && setRequise(r.data.installationRequise))
      .catch(() => actif && setRequise(false))
    return () => {
      actif = false
    }
  }, [location.pathname === '/installation'])

  if (requise === null) return <ChargementPage />
  if (requise && location.pathname !== '/installation') return <Navigate to="/installation" replace />
  if (!requise && location.pathname === '/installation') return <Navigate to="/" replace />
  return <>{children}</>
}
