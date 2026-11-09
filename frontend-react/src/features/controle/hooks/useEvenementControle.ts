import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useRequete } from '../../../core/hooks/useRequete'
import { preferences } from '../../../core/storage/preferences'
import { controleService } from '../services/controleService'

/** EF-40 : événement en cours choisi par l'agent (URL ?evenement=, sinon dernier choix du poste). */
export function useEvenementControle() {
  const [params, setParams] = useSearchParams()
  const liste = useRequete(() => controleService.evenements(), [])
  const demande = params.get('evenement') ?? preferences.lire('controle.evenement')

  const evenement = useMemo(() => {
    const evts = liste.donnees ?? []
    return evts.find((e) => String(e.id) === demande) ?? (evts.length === 1 ? evts[0] : null)
  }, [liste.donnees, demande])

  useEffect(() => {
    if (evenement) preferences.ecrire('controle.evenement', String(evenement.id))
  }, [evenement])

  function choisir(id: string) {
    const p = new URLSearchParams(params)
    if (id) p.set('evenement', id)
    else p.delete('evenement')
    preferences.ecrire('controle.evenement', id || null)
    setParams(p, { replace: true })
  }

  return { evenements: liste.donnees ?? [], chargement: liste.chargement, erreur: liste.erreur, evenement, choisir }
}
