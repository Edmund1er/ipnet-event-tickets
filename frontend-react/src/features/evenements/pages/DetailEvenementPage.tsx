import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../core/auth/AuthContext'
import { messageErreur, versErreurApi } from '../../../core/api/httpClient'
import { Badge } from '../../../core/components/ui/Badge'
import { Bouton } from '../../../core/components/ui/Bouton'
import { ChargementPage } from '../../../core/components/ui/Chargement'
import { Alerte } from '../../../core/components/ui/Divers'
import { Icone } from '../../../core/components/ui/Icone'
import { STATUTS_EVENEMENT, STATUTS_INSCRIPTION, type StatutInscription } from '../../../core/constants/statuts'
import { useRequete } from '../../../core/hooks/useRequete'
import { dateLongue, montant, versDate } from '../../../core/utils/format'
import { JaugePlaces, VisuelEvenement } from '../components/CarteEvenement'
import { evenementService } from '../services/evenementService'

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
  const [erreurResa, setErreurResa] = useState<string | null>(null)
  const [dejaReserve, setDejaReserve] = useState(false)
  const [enCours, setEnCours] = useState(false)

  if (chargement) return <ChargementPage />
  if (erreur || !evt) return <Alerte ton="erreur">{erreur ?? 'Événement introuvable'}</Alerte>

  const passe = (versDate(evt.dateDebut)?.getTime() ?? 0) < Date.now()
  const reservable = evt.statut === 'PUBLIE' && !passe && evt.placesRestantes > 0
  const statut = STATUTS_EVENEMENT[evt.statut]

  async function reserver() {
    setErreurResa(null)
    setEnCours(true)
    try {
      const r = await evenementService.reserver(evt!.id)
      navigate(`/reservations/${r.id}/paiement`)
    } catch (e) {
      const api = versErreurApi(e)
      if (api.code === 'RG-06') setDejaReserve(true)
      setErreurResa(messageErreur(e))
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/" className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-encre transition-colors hover:text-rouge">
        <Icone nom="arrow_back" taille={18} /> Tous les événements
      </Link>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <article className="carte overflow-hidden">
          <VisuelEvenement evenement={evt} className="aspect-[16/8] w-full" />
          {!evt.aImage && <div className="h-2 bg-rouge" aria-hidden />}
          <div className="p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge ton={statut.ton}>{statut.libelle}</Badge>
              {passe && evt.statut === 'PUBLIE' && <Badge ton="gris">Date passée</Badge>}
            </div>
            <h1 className="text-balance text-2xl font-extrabold tracking-tight sm:text-3xl">{evt.titre}</h1>
            {evt.description && <p className="mt-4 whitespace-pre-line leading-relaxed text-encre/85">{evt.description}</p>}
          </div>
        </article>

        <aside className="flex flex-col gap-4">
          <div className="carte p-5">
            <p className="titre-section">Tarif unique</p>
            <p className="mt-1 font-titre text-3xl font-extrabold text-rouge">{montant(evt.prix, evt.devise)}</p>
            <ul className="mt-4 flex flex-col gap-3 text-sm">
              <li className="flex gap-3">
                <Icone nom="calendar_month" className="text-rouge" />
                <span>{dateLongue(evt.dateDebut)}</span>
              </li>
              {evt.lieu && (
                <li className="flex gap-3">
                  <Icone nom="location_on" className="text-rouge" />
                  <span>{evt.lieu}</span>
                </li>
              )}
            </ul>
            <div className="mt-5">
              <JaugePlaces evenement={evt} />
            </div>
          </div>

          <div className="carte flex flex-col gap-3 p-5">
            {erreurResa && <Alerte ton="erreur">{erreurResa}</Alerte>}
            {!session ? (
              <>
                <p className="text-sm text-attenue">Connectez-vous ou créez un compte pour réserver votre place.</p>
                <Link to="/connexion" state={{ depuis: `/evenements/${evt.id}` }} className="inline-flex h-[52px] items-center justify-center rounded-lg bg-rouge font-semibold text-white transition-colors hover:bg-rouge-fonce">
                  Se connecter pour réserver
                </Link>
                <Link to="/inscription" className="text-center text-sm font-semibold text-rouge hover:underline">
                  Créer un compte
                </Link>
              </>
            ) : session.role !== 'PARTICIPANT' ? (
              <Alerte ton="info">La réservation est réservée aux comptes participants.</Alerte>
            ) : !profil?.emailVerifie ? (
              <>
                <Alerte ton="attention">Confirmez votre adresse e-mail avant de réserver (code envoyé par e-mail).</Alerte>
                <Link to="/verification" className="inline-flex h-11 items-center justify-center rounded-lg bg-rouge font-semibold text-white transition-colors hover:bg-rouge-fonce">
                  Vérifier mon compte
                </Link>
              </>
            ) : existante && ['EN_ATTENTE_PAIEMENT', 'PREUVE_ENVOYEE', 'REJETEE', 'CONFIRMEE'].includes(existante.statut) ? (
              <>
                <Alerte ton="info">
                  Vous avez déjà une réservation pour cet événement : {STATUTS_INSCRIPTION[existante.statut as StatutInscription].libelle.toLowerCase()}.
                </Alerte>
                <Link
                  to={existante.statut === 'CONFIRMEE' ? '/billets' : existante.statut === 'PREUVE_ENVOYEE' ? '/reservations' : `/reservations/${existante.id}/paiement`}
                  className="inline-flex h-[52px] items-center justify-center rounded-lg bg-rouge font-semibold text-white transition-colors hover:bg-rouge-fonce"
                >
                  {existante.statut === 'CONFIRMEE' ? 'Voir mon billet' : existante.statut === 'PREUVE_ENVOYEE' ? 'Suivre ma réservation' : 'Payer ma réservation'}
                </Link>
              </>
            ) : dejaReserve ? (
              <Link to="/reservations" className="inline-flex h-[52px] items-center justify-center rounded-lg bg-rouge font-semibold text-white transition-colors hover:bg-rouge-fonce">
                Voir mes réservations
              </Link>
            ) : (
              <Bouton taille="grand" variante="rouge" icone="confirmation_number" enCours={enCours} disabled={!reservable} onClick={reserver}>
                {reservable ? 'Réserver ma place' : evt.placesRestantes === 0 ? 'Complet' : 'Réservation fermée'}
              </Bouton>
            )}
            {session?.role === 'PARTICIPANT' && reservable && (
              <p className="text-xs text-attenue">
                Votre place est retenue pendant le délai de paiement. Le billet est émis après validation du paiement.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
