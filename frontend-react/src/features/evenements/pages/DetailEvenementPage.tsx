import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../core/auth/AuthContext'
import { messageErreur, versErreurApi } from '../../../core/api/httpClient'
import { ChargementPage } from '../../../core/components/ui/Chargement'
import { Alerte } from '../../../core/components/ui/Divers'
import { useRequete } from '../../../core/hooks/useRequete'
import { dateLongue, heure, montant, versDate } from '../../../core/utils/format'
import { BlocReservation } from '../components/BlocReservation'
import { evenementService } from '../services/evenementService'
import { themeDe } from '../theme/ambiances'

/** Page d'un événement : visuel, informations pratiques, programme et réservation. */
export function DetailEvenementPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session, profil } = useAuth()
  const estAdmin = session?.role === 'ADMIN'
  const { donnees: evt, chargement, erreur } = useRequete(() => evenementService.detail(Number(id), estAdmin), [id, estAdmin])
  const estParticipant = session?.role === 'PARTICIPANT'
  const { donnees: existante } = useRequete(
    () => (estParticipant ? evenementService.maReservation(Number(id)) : Promise.resolve(null)),
    [id, estParticipant],
  )
  const estCadre = evt?.type === 'CADRE'
  const { donnees: elements } = useRequete(() => (estCadre ? evenementService.activites(Number(id), estAdmin) : Promise.resolve([])), [id, estCadre, estAdmin])
  const parentId = evt?.parentId ?? null
  const { donnees: parent } = useRequete(() => (parentId ? evenementService.detail(parentId, estAdmin) : Promise.resolve(null)), [parentId, estAdmin])
  const [erreurResa, setErreurResa] = useState<string | null>(null)
  const [dejaReserve, setDejaReserve] = useState(false)
  const [enCours, setEnCours] = useState(false)

  const ouvrirActivite = useCallback((cible: number) => navigate(`/evenements/${cible}`), [navigate])

  if (chargement) return <ChargementPage />
  if (erreur || !evt) return <Alerte ton="erreur">{erreur ?? 'Événement introuvable'}</Alerte>

  // Un pass reste en vente jusqu'à la fin du programme
  const finVente = evt.type === 'PASS' && evt.dateFin ? evt.dateFin : evt.dateDebut
  const passe = (versDate(finVente)?.getTime() ?? 0) < Date.now()
  const reservable = evt.statut === 'PUBLIE' && !passe && evt.placesRestantes > 0
  const passes = (elements ?? []).filter((e) => e.type === 'PASS' && e.statut === 'PUBLIE')

  async function reserver() {
    setErreurResa(null)
    setEnCours(true)
    try {
      const r = await evenementService.reserver(evt!.id)
      // Inscription gratuite : déjà confirmée, le billet est disponible sans paiement
      navigate(r.statut === 'CONFIRMEE'
        ? (evt!.prix === 0 && evt!.qrPourGratuit === false ? '/reservations' : '/billets')
        : `/reservations/${r.id}/paiement`)
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

  const programmeActivites = (elements ?? []).filter((e) => e.type === 'ACTIVITE' && e.statut === 'PUBLIE')

  return (
    <div style={themeDe(evt)} className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <button type="button" onClick={() => navigate(parent ? `/evenements/${parent.id}` : '/')} className="mb-4 text-sm font-semibold text-primaire hover:underline">
        ← {parent ? parent.titre : 'Événements'}
      </button>
      {evt.statut === 'BROUILLON' && <Alerte ton="info">Brouillon : visible par vous seul</Alerte>}
      <header className="overflow-hidden rounded-2xl bg-primaire text-white shadow-lg">
        {evt.aImage && <img src={`/api/evenements/${evt.id}/image`} alt="" className="h-56 w-full object-cover sm:h-80" />}
        <div className="p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide opacity-90">{dateLongue(evt.dateDebut)} · {heure(evt.dateDebut)}</p>
          <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">{evt.titre}</h1>
          {evt.lieu && <p className="mt-2 opacity-90">📍 {evt.lieu}</p>}
        </div>
      </header>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          {evt.description && (
            <section className="carte p-5">
              <h2 className="mb-2 text-lg font-bold">À propos</h2>
              <p className="whitespace-pre-line leading-relaxed">{evt.description}</p>
            </section>
          )}
          {programmeActivites.length > 0 && (
            <section className="carte p-5">
              <h2 className="mb-3 text-lg font-bold">Programme</h2>
              <ul className="divide-y divide-black/5">
                {programmeActivites.map((a) => (
                  <li key={a.id}>
                    <button type="button" onClick={() => ouvrirActivite(a.id)} className="flex w-full items-center justify-between gap-3 py-3 text-left hover:text-primaire">
                      <span><span className="font-semibold">{a.titre}</span><span className="block text-sm text-attenue">{dateLongue(a.dateDebut)} · {heure(a.dateDebut)}</span></span>
                      <span className="text-sm font-semibold">{a.prix === 0 ? 'Gratuit' : montant(a.prix, a.devise)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {passes.length > 0 && (
            <section className="carte p-5">
              <h2 className="mb-3 text-lg font-bold">Pass</h2>
              <ul className="space-y-2">
                {passes.map((p) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => ouvrirActivite(p.id)} className="flex w-full items-center justify-between rounded-lg border border-black/10 p-3 text-left hover:border-primaire">
                      <span className="font-semibold">{p.titre}</span><span>{p.prix === 0 ? 'Gratuit' : montant(p.prix, p.devise)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <aside className="carte h-fit p-5 lg:sticky lg:top-24">{reservation}</aside>
      </div>
    </div>
  )
}
