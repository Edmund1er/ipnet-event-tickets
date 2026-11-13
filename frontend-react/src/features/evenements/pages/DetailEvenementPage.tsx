import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../core/auth/AuthContext'
import { messageErreur, versErreurApi } from '../../../core/api/httpClient'
import { ChargementPage } from '../../../core/components/ui/Chargement'
import { Alerte } from '../../../core/components/ui/Divers'
import { Icone } from '../../../core/components/ui/Icone'
import { useRequete } from '../../../core/hooks/useRequete'
import { versDate } from '../../../core/utils/format'
import { BlocReservation } from '../components/BlocReservation'
import { ModelePage, modeleEffectif } from '../components/ModelesPage'
import { ProgrammeEvenement } from '../components/ProgrammeEvenement'
import { evenementService } from '../services/evenementService'
import { themeDe } from '../theme/ambiances'

/** Page d'un événement : charge les données, puis délègue la mise en page au modèle choisi par l'admin. */
export function DetailEvenementPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session, profil } = useAuth()
  const { donnees: evt, chargement, erreur } = useRequete(() => evenementService.detail(Number(id)), [id])
  const estParticipant = session?.role === 'PARTICIPANT'
  const { donnees: existante } = useRequete(
    () => (estParticipant ? evenementService.maReservation(Number(id)) : Promise.resolve(null)),
    [id, estParticipant],
  )
  const estCadre = evt?.type === 'CADRE'
  const { donnees: elements } = useRequete(() => (estCadre ? evenementService.activites(Number(id)) : Promise.resolve([])), [id, estCadre])
  const parentId = evt?.parentId ?? null
  const { donnees: parent } = useRequete(() => (parentId ? evenementService.detail(parentId) : Promise.resolve(null)), [parentId])
  const [erreurResa, setErreurResa] = useState<string | null>(null)
  const [dejaReserve, setDejaReserve] = useState(false)
  const [enCours, setEnCours] = useState(false)

  if (chargement) return <ChargementPage />
  if (erreur || !evt) return <Alerte ton="erreur">{erreur ?? 'Événement introuvable'}</Alerte>

  // Un pass reste en vente jusqu'à la fin du programme
  const finVente = evt.type === 'PASS' && evt.dateFin ? evt.dateFin : evt.dateDebut
  const passe = (versDate(finVente)?.getTime() ?? 0) < Date.now()
  const reservable = evt.statut === 'PUBLIE' && !passe && evt.placesRestantes > 0

  async function reserver() {
    setErreurResa(null)
    setEnCours(true)
    try {
      const r = await evenementService.reserver(evt!.id)
      // Inscription gratuite : déjà confirmée, le billet est disponible sans paiement
      navigate(r.statut === 'CONFIRMEE' ? '/billets' : `/reservations/${r.id}/paiement`)
    } catch (e) {
      const api = versErreurApi(e)
      if (api.code === 'RG-06') setDejaReserve(true)
      setErreurResa(messageErreur(e))
    } finally {
      setEnCours(false)
    }
  }

  const reservation = (
    <BlocReservation
      evenement={evt}
      role={session?.role ?? null}
      profil={profil}
      existante={existante}
      dejaReserve={dejaReserve}
      erreur={erreurResa}
      enCours={enCours}
      reservable={reservable}
      surReserver={reserver}
    />
  )

  return (
    <div className="mx-auto max-w-6xl" style={themeDe(evt)}>
      <Link to={parent ? `/evenements/${parent.id}` : '/'} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-encre transition-colors hover:text-rouge">
        <Icone nom="arrow_back" taille={18} /> {parent ? parent.titre : 'Tous les événements'}
      </Link>
      <ModelePage
        evt={evt}
        modele={modeleEffectif(evt)}
        passe={passe}
        reservation={reservation}
        corps={estCadre ? <ProgrammeEvenement cadre={evt} elements={elements ?? []} /> : undefined}
      />
    </div>
  )
}
