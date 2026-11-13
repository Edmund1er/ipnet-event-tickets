import { useState } from 'react'
import { Link } from 'react-router-dom'
import { messageErreur } from '../../../core/api/httpClient'
import type { Evenement } from '../../../core/api/types'
import { Badge } from '../../../core/components/ui/Badge'
import { Bouton } from '../../../core/components/ui/Bouton'
import { ChampSelection, ChampTexte } from '../../../core/components/ui/Champ'
import { ChargementPage } from '../../../core/components/ui/Chargement'
import { Alerte, EnteteSection, EtatVide, Modale, Pagination } from '../../../core/components/ui/Divers'
import { Icone } from '../../../core/components/ui/Icone'
import { useToast } from '../../../core/components/ui/Toasts'
import { STATUTS_EVENEMENT, type StatutEvenement } from '../../../core/constants/statuts'
import { useRequete } from '../../../core/hooks/useRequete'
import { dateCourte, heure, montant } from '../../../core/utils/format'
import { adminEvenementService } from '../services/adminEvenementService'

type Action = { type: 'publier' | 'cloturer' | 'annuler' | 'fermer_ventes' | 'rouvrir_ventes' | 'masquer'; evt: Evenement }

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
          <Link to="/admin/evenements/nouveau" className="inline-flex h-11 items-center gap-2 rounded-lg bg-primaire px-4 font-semibold text-white hover:bg-primaire-fonce">
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
        <div className="carte overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-bordure bg-surface text-left">
                {['Événement', 'Date', 'Prix', 'Remplissage', 'Statut', ''].map((h) => (
                  <th key={h} scope="col" className="titre-section px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {donnees.elements.map((e) => {
                const s = STATUTS_EVENEMENT[e.statut]
                return (
                  <tr key={e.id} className="border-b border-bordure last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{e.titre}</p>
                      {e.lieu && <p className="text-xs text-attenue">{e.lieu}</p>}
                    </td>
                    <td className="chiffres whitespace-nowrap px-4 py-3">
                      {dateCourte(e.dateDebut)}
                      <span className="block text-xs text-attenue">{heure(e.dateDebut)}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{montant(e.prix, e.devise)}</td>
                    <td className="chiffres px-4 py-3">
                      {e.placesReservees} / {e.capacite}
                    </td>
                    <td className="px-4 py-3">
                      <Badge ton={s.ton}>{s.libelle}</Badge>
                      {e.passe && e.statut === 'PUBLIE' && (
                        <span className="ml-1 inline-block align-middle">
                          <Badge ton="gris">Passé</Badge>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1">
                        {(e.statut === 'BROUILLON' || e.statut === 'PUBLIE') && (
                          <Link to={`/admin/evenements/${e.id}`} className="inline-flex h-9 items-center gap-1 rounded-lg px-2 font-semibold text-primaire hover:bg-primaire-clair" title="Modifier">
                            <Icone nom="edit" taille={18} /> Modifier
                          </Link>
                        )}
                        {e.type === 'CADRE' && (
                          <Link to={`/admin/evenements/${e.id}/programme`} className="inline-flex h-9 items-center gap-1 rounded-lg px-2 font-semibold text-primaire hover:bg-primaire-clair">
                            <Icone nom="calendar_view_week" taille={18} /> Programme
                          </Link>
                        )}
                        {e.statut === 'BROUILLON' && (
                          <Bouton taille="petit" variante="fantome" icone="publish" onClick={() => setAction({ type: 'publier', evt: e })}>
                            Publier
                          </Bouton>
                        )}
                        {e.statut !== 'BROUILLON' && (
                          <Link to={`/admin/evenements/${e.id}/participants`} className="inline-flex h-9 items-center gap-1 rounded-lg px-2 font-semibold text-primaire hover:bg-primaire-clair">
                            <Icone nom="group" taille={18} /> Participants
                          </Link>
                        )}
                        {e.statut === 'PUBLIE' && (
                          e.ventesSuspendues ? (
                            <Bouton taille="petit" variante="fantome" icone="play_arrow" onClick={() => setAction({ type: 'rouvrir_ventes', evt: e })}>
                              Rouvrir les ventes
                            </Bouton>
                          ) : (
                            <Bouton taille="petit" variante="fantome" icone="pause" onClick={() => setAction({ type: 'fermer_ventes', evt: e })}>
                              Fermer les ventes
                            </Bouton>
                          )
                        )}
                        {e.statut === 'PUBLIE' && (
                          <Bouton taille="petit" variante="fantome" icone="flag" onClick={() => setAction({ type: 'cloturer', evt: e })}>
                            Clôturer
                          </Bouton>
                        )}
                        {(e.passe || e.statut === 'TERMINE' || e.statut === 'ANNULE') && (
                          <Bouton taille="petit" variante="fantome" icone="visibility_off" onClick={() => setAction({ type: 'masquer', evt: e })}>
                            Masquer
                          </Bouton>
                        )}
                        {(e.statut === 'BROUILLON' || e.statut === 'PUBLIE') && (
                          <Bouton taille="petit" variante="fantome" icone="cancel" className="!text-rouge" onClick={() => setAction({ type: 'annuler', evt: e })}>
                            Annuler
                          </Bouton>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
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
