import { useState } from 'react'
import { Link } from 'react-router-dom'
import { messageErreur } from '../../../core/api/httpClient'
import type { Evenement } from '../../../core/api/types'
import { Bouton, classeBouton } from '../../../core/components/ui/Bouton'
import { ChampSelection, ChampTexte } from '../../../core/components/ui/Champ'
import { ChargementPage } from '../../../core/components/ui/Chargement'
import { Alerte, EnteteSection, EtatVide, Modale, Pagination } from '../../../core/components/ui/Divers'
import { Icone } from '../../../core/components/ui/Icone'
import { useToast } from '../../../core/components/ui/Toasts'
import { STATUTS_EVENEMENT, type StatutEvenement } from '../../../core/constants/statuts'
import { useRequete } from '../../../core/hooks/useRequete'
import { TableEvenements, type TypeAction } from '../components/TableEvenements'
import { adminEvenementService } from '../services/adminEvenementService'

type Action = { type: TypeAction; evt: Evenement }

export function AdminEvenementsPage() {
  const [statut, setStatut] = useState<StatutEvenement | ''>('')
  const [titre, setTitre] = useState('')
  const [recherche, setRecherche] = useState('')
  const [page, setPage] = useState(0)
  const { donnees, chargement, erreur, recharger } = useRequete(
    () => adminEvenementService.lister(statut, recherche, page),
    [statut, recherche, page],
  )
  const [action, setAction] = useState<Action | null>(null)
  const [motif, setMotif] = useState('')
  const [enCours, setEnCours] = useState(false)
  const toast = useToast()

  async function executer() {
    if (!action) return
    if (action.type === 'annuler' && !motif.trim()) return
    setEnCours(true)
    try {
      if (action.type === 'publier') await adminEvenementService.publier(action.evt.id)
      if (action.type === 'cloturer') await adminEvenementService.cloturer(action.evt.id)
      if (action.type === 'annuler') await adminEvenementService.annuler(action.evt.id, motif.trim())
      if (action.type === 'fermer_ventes') await adminEvenementService.fermerVentes(action.evt.id)
      if (action.type === 'rouvrir_ventes') await adminEvenementService.rouvrirVentes(action.evt.id)
      if (action.type === 'masquer') await adminEvenementService.masquer(action.evt.id)
      toast.succes(
        action.type === 'publier'
          ? 'Événement publié'
          : action.type === 'cloturer'
          ? 'Événement clôturé'
          : action.type === 'fermer_ventes'
          ? 'Ventes suspendues'
          : action.type === 'rouvrir_ventes'
          ? 'Ventes rouvertes'
          : action.type === 'masquer'
          ? 'Événement masqué définitivement'
          : 'Événement annulé, participants informés par e-mail',
      )
      setAction(null)
      setMotif('')
      await recharger()
    } catch (e) {
      toast.erreur(messageErreur(e))
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div>
      <EnteteSection
        icone="event"
        titre="Événements"
        sousTitre="Création, publication, modification et annulation"
        actions={
          <Link to="/admin/evenements/nouveau" className={classeBouton('primaire')}>
            <Icone nom="add" /> Nouvel événement
          </Link>
        }
      />

      <form
        className="carte mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault()
          setPage(0)
          setRecherche(titre)
        }}
      >
        <div className="flex-1">
          <label htmlFor="recherche" className="etiquette">
            Rechercher
          </label>
          <input id="recherche" className="champ" placeholder="Titre" value={titre} onChange={(e) => setTitre(e.target.value)} />
        </div>
        <ChampSelection
          libelle="Statut"
          className="sm:w-52"
          value={statut}
          onChange={(e) => {
            setPage(0)
            setStatut(e.target.value as StatutEvenement | '')
          }}
        >
          <option value="">Tous</option>
          {Object.entries(STATUTS_EVENEMENT).map(([k, v]) => (
            <option key={k} value={k}>
              {v.libelle}
            </option>
          ))}
        </ChampSelection>
        <Bouton type="submit" icone="search" variante="secondaire">
          Rechercher
        </Bouton>
      </form>

      {erreur && <Alerte ton="erreur">{erreur}</Alerte>}
      {chargement && <ChargementPage />}
      {!chargement && donnees?.elements.length === 0 && <EtatVide icone="event_busy" titre="Aucun événement" texte="Créez votre premier événement." />}
      {!chargement && donnees && donnees.elements.length > 0 && (
        <TableEvenements elements={donnees.elements} surAction={(type, evt) => setAction({ type, evt })} />
      )}
      {donnees && <Pagination page={donnees.page} totalPages={donnees.totalPages} surChangement={setPage} />}

      <Modale
        ouverte={!!action}
        titre={
          action?.type === 'publier'
            ? "Publier l'événement"
            : action?.type === 'cloturer'
            ? "Clôturer l'événement"
            : action?.type === 'fermer_ventes'
            ? 'Suspendre les ventes'
            : action?.type === 'rouvrir_ventes'
            ? 'Rouvrir les ventes'
            : action?.type === 'masquer'
            ? 'Masquer définitivement'
            : "Annuler l'événement"
        }
        surFermeture={() => {
          setAction(null)
          setMotif('')
        }}
        pied={
          <>
            <Bouton variante="fantome" onClick={() => setAction(null)}>
              Retour
            </Bouton>
            <Bouton
              variante={action?.type === 'annuler' || action?.type === 'masquer' ? 'danger' : 'primaire'}
              enCours={enCours}
              disabled={action?.type === 'annuler' && !motif.trim()}
              onClick={executer}
            >
              Confirmer
            </Bouton>
          </>
        }
      >
        {action?.type === 'publier' && (
          <p>
            <strong>{action.evt.titre}</strong> sera visible publiquement et ouvert aux réservations.
          </p>
        )}
        {action?.type === 'cloturer' && (
          <p>
            <strong>{action.evt.titre}</strong> passera au statut « Terminé » et ne sera plus réservable.
          </p>
        )}
        {action?.type === 'fermer_ventes' && (
          <p>
            Suspendre temporairement les ventes pour <strong>{action.evt.titre}</strong>. Les participants ne pourront plus réserver tant que vous ne les rouvrirez pas.
          </p>
        )}
        {action?.type === 'masquer' && (
          <Alerte ton="attention" titre="Action définitive">
            <strong>{action.evt.titre}</strong> disparaîtra de toutes les listes, côté client comme côté administration. Les réservations et les billets déjà émis sont conservés.
          </Alerte>
        )}
        {action?.type === 'rouvrir_ventes' && (
          <p>
            Rouvrir les réservations pour <strong>{action.evt.titre}</strong>.
          </p>
        )}
        {action?.type === 'annuler' && (
          <div className="flex flex-col gap-4">
            <Alerte ton="erreur" titre="Action irréversible">
              Les {action.evt.placesReservees} réservation(s) active(s) seront annulées, les billets émis invalidés, les paiements validés
              passeront « à rembourser » et chaque participant sera informé par e-mail.
            </Alerte>
            <ChampTexte libelle="Motif (communiqué aux participants)" value={motif} onChange={(e) => setMotif(e.target.value)} maxLength={255} />
          </div>
        )}
      </Modale>
    </div>
  )
}
