import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../core/auth/AuthContext'
import { messageErreur, versErreurApi } from '../../../core/api/httpClient'
import { useImmersion } from '../../../core/components/layout/Immersion'
import { ChargementPage } from '../../../core/components/ui/Chargement'
import { Alerte } from '../../../core/components/ui/Divers'
import { useRequete } from '../../../core/hooks/useRequete'
import { versDate } from '../../../core/utils/format'
import { BlocReservation } from '../components/BlocReservation'
import { ModaleReservation } from '../components/ModaleReservation'
import { COULEURS_MODELE } from '../site/immersion'
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
  // La page prend toute la place et habille l'en-tête et le menu aux couleurs de son template
  const modeleCourant = modeleEffectif(evt?.modele, parent?.modele, evt?.type === 'CADRE')
  useImmersion(
    evt
      ? {
          ...COULEURS_MODELE[modeleCourant],
          retour: { libelle: parent ? parent.titre : 'Événements', vers: parent ? `/evenements/${parent.id}` : '/' },
          badge: evt.statut === 'BROUILLON' ? 'Brouillon : visible par vous seul' : undefined,
        }
      : null,
  )
  const ouvrirActivite = useCallback((cible: number) => navigate(`/evenements/${cible}`), [navigate])

  if (chargement) return <ChargementPage />
  if (erreur || !evt) return <Alerte ton="erreur">{erreur ?? 'Événement introuvable'}</Alerte>

  // Un pass reste en vente jusqu'à la fin du programme
  const finVente = evt.type === 'PASS' && evt.dateFin ? evt.dateFin : evt.dateDebut
  const passe = (versDate(finVente)?.getTime() ?? 0) < Date.now()
  const reservable = evt.statut === 'PUBLIE' && !passe && evt.placesRestantes > 0
  const passes = (elements ?? []).filter((e) => e.type === 'PASS' && e.statut === 'PUBLIE')
  const modele = modeleCourant

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
    <div className="h-[calc(100dvh-4rem)] min-h-[420px]" style={themeDe(evt)}>
      <PageSite evenement={evt} elements={elements ?? []} config={config ?? PAGE_VIDE} modele={modele} surReserver={ouvrirReservation} surOuvrir={ouvrirActivite} />
      <ModaleReservation evenement={evt} passes={passes} ouverte={ouverte} surFermeture={() => setOuverte(false)} reservation={reservation} />
    </div>
  )
}
