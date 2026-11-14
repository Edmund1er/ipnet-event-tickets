import { useCallback, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../core/auth/AuthContext'
import { messageErreur, versErreurApi } from '../../../core/api/httpClient'
import { Bouton } from '../../../core/components/ui/Bouton'
import { ChargementPage } from '../../../core/components/ui/Chargement'
import { Alerte } from '../../../core/components/ui/Divers'
import { Icone } from '../../../core/components/ui/Icone'
import { useRequete } from '../../../core/hooks/useRequete'
import { versDate } from '../../../core/utils/format'
import { BlocReservation } from '../components/BlocReservation'
import { ModaleReservation } from '../components/ModaleReservation'
import { PageSite } from '../site/PageSite'
import { PAGE_VIDE, modeleDe, type CleModele } from '../site/types'
import { evenementService } from '../services/evenementService'
import { themeDe } from '../theme/ambiances'

/** Modèle choisi par l'admin ; une activité ou un pass reprend celui de son programme ; à défaut, un modèle par type d'événement. */
function modeleEffectif(modele: string | null | undefined, modeleParent: string | null | undefined, programme: boolean): CleModele {
  return (modeleDe(modele)?.cle ?? modeleDe(modeleParent)?.cle ?? (programme ? 'RENCONTRE' : 'CEREMONIE')) as CleModele
}

/**
 * Page d'un événement. Elle se présente comme un site à part, dans l'espace à droite du menu :
 * le template choisi, rempli par les sections de l'administrateur (ou la page de base s'il n'en a pas ajouté).
 */
export function DetailEvenementPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session, profil } = useAuth()
  const estAdmin = session?.role === 'ADMIN'
  const { donnees: evt, chargement, erreur } = useRequete(() => evenementService.detail(Number(id), estAdmin), [id, estAdmin])
  const { donnees: config } = useRequete(() => evenementService.page(Number(id), estAdmin).catch(() => PAGE_VIDE), [id, estAdmin])
  const estParticipant = session?.role === 'PARTICIPANT'
  const { donnees: existante } = useRequete(
    () => (estParticipant ? evenementService.maReservation(Number(id)) : Promise.resolve(null)),
    [id, estParticipant],
  )
  const estCadre = evt?.type === 'CADRE'
  const { donnees: elements } = useRequete(() => (estCadre ? evenementService.activites(Number(id), estAdmin) : Promise.resolve([])), [id, estCadre, estAdmin])
  const parentId = evt?.parentId ?? null
  const { donnees: parent } = useRequete(() => (parentId ? evenementService.detail(parentId, estAdmin) : Promise.resolve(null)), [parentId, estAdmin])
  const [ouverte, setOuverte] = useState(false)
  const [erreurResa, setErreurResa] = useState<string | null>(null)
  const [dejaReserve, setDejaReserve] = useState(false)
  const [enCours, setEnCours] = useState(false)

  const ouvrirReservation = useCallback(() => setOuverte(true), [])
  const ouvrirActivite = useCallback((cible: number) => navigate(`/evenements/${cible}`), [navigate])

  if (chargement) return <ChargementPage />
  if (erreur || !evt) return <Alerte ton="erreur">{erreur ?? 'Événement introuvable'}</Alerte>

  // Un pass reste en vente jusqu'à la fin du programme
  const finVente = evt.type === 'PASS' && evt.dateFin ? evt.dateFin : evt.dateDebut
  const passe = (versDate(finVente)?.getTime() ?? 0) < Date.now()
  const reservable = evt.statut === 'PUBLIE' && !passe && evt.placesRestantes > 0
  const passes = (elements ?? []).filter((e) => e.type === 'PASS' && e.statut === 'PUBLIE')
  const modele = modeleEffectif(evt.modele, parent?.modele, !!estCadre)

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
    <div className="-mx-3 -my-6 flex h-[calc(100dvh-6.5rem)] min-h-[480px] flex-col sm:-mx-8 sm:-my-9" style={themeDe(evt)}>
      {/* Barre de l'application : retour, brouillon éventuel, réservation toujours accessible */}
      <div className="flex items-center justify-between gap-3 border-b border-black/10 bg-white px-4 py-2">
        <Link to={parent ? `/evenements/${parent.id}` : '/'} className="inline-flex items-center gap-1 text-sm font-semibold text-encre hover:text-rouge">
          <Icone nom="arrow_back" taille={18} /> {parent ? parent.titre : 'Tous les événements'}
        </Link>
        <div className="flex items-center gap-3">
          {evt.statut === 'BROUILLON' && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">Brouillon : visible par vous seul</span>}
          {!evt.accesLibre && (
            <Bouton variante="rouge" taille="petit" icone="confirmation_number" onClick={ouvrirReservation}>
              {estCadre ? 'Choisir un pass' : evt.prix === 0 ? 'M’inscrire' : 'Réserver'}
            </Bouton>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <PageSite evenement={evt} elements={elements ?? []} config={config ?? PAGE_VIDE} modele={modele} surReserver={ouvrirReservation} surOuvrir={ouvrirActivite} />
      </div>
      <ModaleReservation evenement={evt} passes={passes} ouverte={ouverte} surFermeture={() => setOuverte(false)} reservation={reservation} />
    </div>
  )
}
