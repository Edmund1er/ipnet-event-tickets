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
import { dateCourte, dateLongue, heure, montant, versDate } from '../../../core/utils/format'
import { JaugePlaces, VisuelEvenement } from '../components/CarteEvenement'
import { ProgrammeEvenement } from '../components/ProgrammeEvenement'
import { evenementService } from '../services/evenementService'
import { themeEvenement } from '../theme/ambiances'

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
  const { donnees: elements } = useRequete(
    () => (estCadre ? evenementService.activites(Number(id)) : Promise.resolve([])),
    [id, estCadre],
  )
  const parentId = evt?.parentId ?? null
  const { donnees: parent } = useRequete(
    () => (parentId ? evenementService.detail(parentId) : Promise.resolve(null)),
    [parentId],
  )
  const [erreurResa, setErreurResa] = useState<string | null>(null)
  const [dejaReserve, setDejaReserve] = useState(false)
  const [enCours, setEnCours] = useState(false)

  if (chargement) return <ChargementPage />
  if (erreur || !evt) return <Alerte ton="erreur">{erreur ?? 'Événement introuvable'}</Alerte>

  // Un pass reste en vente jusqu'à la fin du programme
  const finVente = evt.type === 'PASS' && evt.dateFin ? evt.dateFin : evt.dateDebut
  const passe = (versDate(finVente)?.getTime() ?? 0) < Date.now()
  const gratuit = evt.prix === 0
  const estPass = evt.type === 'PASS'
  // Page construite avec ce que l'admin a rempli : sans description ni image, une simple carte suffit
  const aPresentation = !!evt.description?.trim() || evt.aImage
  const reservable = evt.statut === 'PUBLIE' && !passe && evt.placesRestantes > 0
  const statut = STATUTS_EVENEMENT[evt.statut]

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

  if (estCadre) {
    return (
      <div className="mx-auto max-w-4xl" style={themeEvenement(evt.ambiance, evt.couleurPrincipale)}>
        <Link to="/" className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-encre transition-colors hover:text-rouge">
          <Icone nom="arrow_back" taille={18} /> Tous les événements
        </Link>
        <header
          className="mb-8 overflow-hidden rounded-xl"
          style={{ backgroundImage: 'var(--ev-motif), linear-gradient(135deg, var(--ev-primaire), var(--ev-fonce))', color: 'var(--ev-sur-primaire)' }}
        >
          {evt.aImage && <VisuelEvenement evenement={evt} className="aspect-[16/6] w-full" />}
          <div className="p-6 sm:p-8">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge ton={statut.ton}>{statut.libelle}</Badge>
            </div>
            <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">{evt.titre}</h1>
            <p className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm font-semibold opacity-90">
              <span className="inline-flex items-center gap-1"><Icone nom="calendar_month" taille={18} /> {dateCourte(evt.dateDebut)} → {dateCourte(evt.dateFin)}</span>
              {evt.lieu && <span className="inline-flex items-center gap-1"><Icone nom="location_on" taille={18} /> {evt.lieu}</span>}
            </p>
            {evt.description && <p className="mt-4 max-w-2xl whitespace-pre-line leading-relaxed opacity-95">{evt.description}</p>}
          </div>
        </header>
        <ProgrammeEvenement cadre={evt} elements={elements ?? []} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl" style={themeEvenement(evt.ambiance, evt.couleurPrincipale)}>
      <Link to={parent ? `/evenements/${parent.id}` : '/'} className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-encre transition-colors hover:text-rouge">
        <Icone nom="arrow_back" taille={18} /> {parent ? parent.titre : 'Tous les événements'}
      </Link>
      <div className={aPresentation ? 'grid gap-6 lg:grid-cols-[1fr_360px]' : 'mx-auto max-w-md'}>
        {aPresentation && (
        <article className="carte overflow-hidden">
          <VisuelEvenement evenement={evt} className="aspect-[16/8] w-full" />
          {!evt.aImage && (
            <div
              className="flex aspect-[16/6] items-end p-6"
              style={{
                backgroundImage: 'var(--ev-motif), linear-gradient(135deg, var(--ev-primaire), var(--ev-fonce))',
                color: 'var(--ev-sur-primaire)',
              }}
              aria-hidden
            >
              <Icone nom="event" taille={44} className="opacity-60" />
            </div>
          )}
          <div className="p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge ton={statut.ton}>{statut.libelle}</Badge>
              {passe && evt.statut === 'PUBLIE' && <Badge ton="gris">Date passée</Badge>}
              {estPass && <Badge ton="violet">Pass</Badge>}
              {estCadre && <Badge ton="violet">Programme</Badge>}
            </div>
            <h1 className="text-balance text-2xl font-extrabold tracking-tight sm:text-3xl">{evt.titre}</h1>
            {evt.description && <p className="mt-4 whitespace-pre-line leading-relaxed text-encre/85">{evt.description}</p>}
          </div>
        </article>
        )}

        <aside className="flex flex-col gap-4">
          <div className="carte p-5">
            {!aPresentation && (
              <div className="mb-4 border-b border-bordure pb-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge ton={statut.ton}>{statut.libelle}</Badge>
                  {estPass && <Badge ton="violet">Pass</Badge>}
                </div>
                <h1 className="text-balance text-2xl font-extrabold tracking-tight">{evt.titre}</h1>
              </div>
            )}
            <p className="titre-section">{estPass ? 'Pass' : 'Tarif unique'}</p>
            <p className="mt-1 font-titre text-3xl font-extrabold text-rouge">{evt.accesLibre ? 'Accès libre' : gratuit ? 'Gratuit' : montant(evt.prix, evt.devise)}</p>
            <ul className="mt-4 flex flex-col gap-3 text-sm">
              <li className="flex gap-3">
                <Icone nom="calendar_month" className="text-rouge" />
                <span>
                  {dateLongue(evt.dateDebut)}
                  {evt.dateFin && !estPass && <> — {heure(evt.dateFin)}</>}
                  {estPass && evt.passPortee === 'GLOBAL' && ' · valable pendant tout le programme'}
                </span>
              </li>
              {evt.lieu && (
                <li className="flex gap-3">
                  <Icone nom="location_on" className="text-rouge" />
                  <span>{evt.lieu}</span>
                </li>
              )}
            </ul>
            {!evt.accesLibre && (
              <div className="mt-5">
                <JaugePlaces evenement={evt} />
              </div>
            )}
          </div>

          {evt.accesLibre ? (
            <Alerte ton="info">Accès libre : aucune réservation nécessaire, venez directement.</Alerte>
          ) : (
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
                {reservable ? (gratuit ? 'M’inscrire gratuitement' : estPass ? 'Acheter ce pass' : 'Réserver ma place') : evt.placesRestantes === 0 ? 'Complet' : 'Réservation fermée'}
              </Bouton>
            )}
            {session?.role === 'PARTICIPANT' && reservable && !gratuit && (
              <p className="text-xs text-attenue">
                Votre place est retenue pendant le délai de paiement. Le billet est émis après validation du paiement.
              </p>
            )}
          </div>
          )}
        </aside>
      </div>
    </div>
  )
}
