import { Link } from 'react-router-dom'
import type { Evenement, ProfilResponse } from '../../../core/api/types'
import { Bouton, classeBouton } from '../../../core/components/ui/Bouton'
import { Alerte } from '../../../core/components/ui/Divers'
import { STATUTS_INSCRIPTION, type StatutInscription } from '../../../core/constants/statuts'

export interface ReservationExistante {
  id: number
  statut: string
}

interface Props {
  evenement: Evenement
  /** Connecté ou non, et avec quel rôle. */
  role: string | null
  profil: ProfilResponse | null
  existante: ReservationExistante | null
  dejaReserve: boolean
  erreur: string | null
  enCours: boolean
  reservable: boolean
  surReserver: () => void
}

/**
 * Tout ce qui concerne l'acte de réserver, quel que soit le modèle de page :
 * connexion, vérification, réservation existante, bouton de réservation. La page ne fait que l'afficher.
 */
export function BlocReservation({ evenement: evt, role, profil, existante, dejaReserve, erreur, enCours, reservable, surReserver }: Props) {
  const gratuit = evt.prix === 0
  const estPass = evt.type === 'PASS'

  if (evt.accesLibre) return <Alerte ton="info">Accès libre : aucune réservation nécessaire, venez directement.</Alerte>

  return (
    <div className="flex flex-col gap-3">
      {erreur && <Alerte ton="erreur">{erreur}</Alerte>}
      {!role ? (
        <>
          <p className="text-sm text-attenue">Connectez-vous ou créez un compte pour réserver votre place.</p>
          <Link to="/connexion" state={{ depuis: `/evenements/${evt.id}` }} className={classeBouton('rouge', 'grand', 'w-full')}>
            Se connecter pour réserver
          </Link>
          <Link to="/inscription" className={classeBouton('secondaire', 'normal', 'w-full')}>
            Créer un compte
          </Link>
        </>
      ) : role !== 'PARTICIPANT' ? (
        <Alerte ton="info">La réservation est réservée aux comptes participants.</Alerte>
      ) : !profil?.emailVerifie ? (
        <>
          <Alerte ton="attention">Confirmez votre adresse e-mail avant de réserver (code envoyé par e-mail).</Alerte>
          <Link to="/verification" className={classeBouton('rouge', 'normal', 'w-full')}>
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
            className={classeBouton('rouge', 'grand', 'w-full')}
          >
            {existante.statut === 'CONFIRMEE' ? 'Voir mon billet' : existante.statut === 'PREUVE_ENVOYEE' ? 'Suivre ma réservation' : 'Payer ma réservation'}
          </Link>
        </>
      ) : dejaReserve ? (
        <Link to="/reservations" className={classeBouton('rouge', 'grand', 'w-full')}>
          Voir mes réservations
        </Link>
      ) : (
        <Bouton taille="grand" variante="rouge" icone="confirmation_number" className="w-full" enCours={enCours} disabled={!reservable} onClick={surReserver}>
          {reservable ? (gratuit ? 'M’inscrire gratuitement' : estPass ? 'Acheter ce pass' : 'Réserver ma place') : evt.placesRestantes === 0 ? 'Complet' : 'Réservation fermée'}
        </Bouton>
      )}
      {role === 'PARTICIPANT' && reservable && !gratuit && (
        <p className="text-xs text-attenue">Votre place est retenue pendant le délai de paiement. Le billet est émis après validation du paiement.</p>
      )}
    </div>
  )
}
