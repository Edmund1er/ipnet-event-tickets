import { useState } from 'react'
import { Link } from 'react-router-dom'
import { messageErreur } from '../../../core/api/httpClient'
import { Badge } from '../../../core/components/ui/Badge'
import { Bouton } from '../../../core/components/ui/Bouton'
import { ChargementPage } from '../../../core/components/ui/Chargement'
import { Alerte, EnteteSection, EtatVide, Modale, Pagination } from '../../../core/components/ui/Divers'
import { Icone } from '../../../core/components/ui/Icone'
import { useToast } from '../../../core/components/ui/Toasts'
import { STATUTS_INSCRIPTION } from '../../../core/constants/statuts'
import { useRequete } from '../../../core/hooks/useRequete'
import { dateCourte, dateLongue, montant, tempsRestant } from '../../../core/utils/format'
import { reservationService, type Reservation } from '../services/reservationService'

const MOTIFS: Record<string, string> = {
  evenement_annule: "L'événement a été annulé",
  annulation_participant: 'Annulée à votre demande',
  'Expiration délai de paiement': 'Délai de paiement dépassé',
}

export function MesReservationsPage() {
  const [page, setPage] = useState(0)
  const { donnees, chargement, erreur, recharger } = useRequete(() => reservationService.mesReservations(page), [page])
  const [aAnnuler, setAAnnuler] = useState<Reservation | null>(null)
  const [enCours, setEnCours] = useState(false)
  const toast = useToast()

  async function confirmerAnnulation() {
    if (!aAnnuler) return
    setEnCours(true)
    try {
      await reservationService.annuler(aAnnuler.id)
      toast.succes('Réservation annulée, votre place est libérée.')
      setAAnnuler(null)
      await recharger()
    } catch (e) {
      toast.erreur(messageErreur(e))
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div>
      <EnteteSection icone="receipt_long" titre="Mes réservations" sousTitre="Suivez le paiement de vos réservations" />
      {erreur && <Alerte ton="erreur">{erreur}</Alerte>}
      {chargement && <ChargementPage />}
      {!chargement && donnees?.elements.length === 0 && (
        <EtatVide
          icone="confirmation_number"
          titre="Aucune réservation"
          texte="Choisissez un événement pour réserver votre place."
          action={
            <Link to="/" className="inline-flex h-11 items-center rounded-lg bg-primaire px-4 font-semibold text-white">
              Voir les événements
            </Link>
          }
        />
      )}
      {!chargement && donnees && donnees.elements.length > 0 && (
        <>
          <ul className="flex flex-col gap-3">
            {donnees.elements.map((r) => (
              <LigneReservation key={r.id} r={r} surAnnulation={() => setAAnnuler(r)} />
            ))}
          </ul>
          <Pagination page={donnees.page} totalPages={donnees.totalPages} surChangement={setPage} />
        </>
      )}

      <Modale
        ouverte={!!aAnnuler}
        titre="Annuler la réservation"
        surFermeture={() => setAAnnuler(null)}
        pied={
          <>
            <Bouton variante="fantome" onClick={() => setAAnnuler(null)}>
              Conserver
            </Bouton>
            <Bouton variante="danger" icone="cancel" enCours={enCours} onClick={confirmerAnnulation}>
              Annuler la réservation
            </Bouton>
          </>
        }
      >
        <p>
          Voulez-vous vraiment annuler votre réservation pour <strong>{aAnnuler?.evenement.titre}</strong> ? Votre place sera libérée.
        </p>
      </Modale>
    </div>
  )
}

function LigneReservation({ r, surAnnulation }: { r: Reservation; surAnnulation: () => void }) {
  const statut = STATUTS_INSCRIPTION[r.statut]
  const attente = r.statut === 'EN_ATTENTE_PAIEMENT' || r.statut === 'REJETEE'
  const annulable = r.statut === 'EN_ATTENTE_PAIEMENT' || r.statut === 'PREUVE_ENVOYEE' || r.statut === 'REJETEE'
  const delai = attente ? tempsRestant(r.expireLe) : null

  return (
    <li className="carte flex flex-col gap-4 p-5 md:flex-row md:items-center">
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge ton={statut.ton}>{statut.libelle}</Badge>
          <span className="text-xs text-attenue">Réservée le {dateCourte(r.creeLe)}</span>
        </div>
        <Link to={`/evenements/${r.evenement.id}`} className="text-lg font-semibold hover:text-primaire">
          {r.evenement.titre}
        </Link>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-attenue">
          <Icone nom="calendar_month" taille={16} /> {dateLongue(r.evenement.dateDebut)}
        </p>
        {r.statut === 'REJETEE' && r.motif && (
          <p className="mt-2 text-sm text-rouge">
            <strong>Motif du rejet :</strong> {r.motif}
          </p>
        )}
        {(r.statut === 'ANNULEE' || r.statut === 'EXPIREE') && r.motif && (
          <p className="mt-2 text-sm text-attenue">{MOTIFS[r.motif] ?? r.motif}</p>
        )}
        {r.statut === 'PREUVE_ENVOYEE' && (
          <p className="mt-2 text-sm text-primaire">Votre référence est en cours de vérification. Le billet vous sera envoyé dès validation.</p>
        )}
        {delai && (
          <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-alerte">
            <Icone nom="schedule" taille={16} />
            {delai === 'expirée' ? 'Délai de paiement dépassé' : `À payer avant expiration : ${delai}`}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
        <p className="font-titre text-xl font-bold text-encre">{montant(r.montant, r.devise)}</p>
        <div className="flex flex-wrap gap-2">
          {attente && (
            <Link to={`/reservations/${r.id}/paiement`} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-rouge px-3 text-sm font-semibold text-white hover:bg-rouge-fonce">
              <Icone nom="payments" taille={18} />
              {r.statut === 'REJETEE' ? 'Renvoyer une référence' : 'Payer'}
            </Link>
          )}
          {r.statut === 'CONFIRMEE' && (
            <Link to="/billets" className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primaire px-3 text-sm font-semibold text-white">
              <Icone nom="qr_code_2" taille={18} /> Voir le billet
            </Link>
          )}
          {annulable && (
            <Bouton variante="fantome" taille="petit" icone="cancel" onClick={surAnnulation}>
              Annuler
            </Bouton>
          )}
        </div>
      </div>
    </li>
  )
}
