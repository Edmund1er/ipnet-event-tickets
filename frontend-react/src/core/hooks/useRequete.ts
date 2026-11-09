import { useCallback, useEffect, useRef, useState } from 'react'
import { messageErreur, urlBlob } from '../api/httpClient'

/** Charge des données depuis l'API et expose l'état (données, chargement, erreur, recharger). */
export function useRequete<T>(charger: () => Promise<T>, dependances: unknown[] = []) {
  const [donnees, setDonnees] = useState<T | null>(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const chargerRef = useRef(charger)
  chargerRef.current = charger

  const recharger = useCallback(async () => {
    setChargement(true)
    setErreur(null)
    try {
      setDonnees(await chargerRef.current())
    } catch (e) {
      setErreur(messageErreur(e))
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    void recharger()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependances)

  return { donnees, chargement, erreur, recharger, setDonnees }
}

/** Image protégée par authentification chargée en Blob (QR, capture, image admin). */
export function useImageProtegee(chemin: string | null) {
  const [url, setUrl] = useState<string | null>(null)
  const [erreur, setErreur] = useState(false)
  useEffect(() => {
    if (!chemin) return
    let actuelle: string | null = null
    let actif = true
    setErreur(false)
    urlBlob(chemin)
      .then((u) => {
        actuelle = u
        if (actif) setUrl(u)
        else URL.revokeObjectURL(u)
      })
      .catch(() => actif && setErreur(true))
    return () => {
      actif = false
      if (actuelle) URL.revokeObjectURL(actuelle)
      setUrl(null)
    }
  }, [chemin])
  return { url, erreur }
}
