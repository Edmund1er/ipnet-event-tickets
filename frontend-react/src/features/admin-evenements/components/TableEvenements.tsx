import { Link } from 'react-router-dom'
import type { Evenement } from '../../../core/api/types'
import { Badge } from '../../../core/components/ui/Badge'
import { Bouton, classeBouton } from '../../../core/components/ui/Bouton'
import { Icone } from '../../../core/components/ui/Icone'
import { STATUTS_EVENEMENT } from '../../../core/constants/statuts'
import { heure, montant } from '../../../core/utils/format'
import { themeDe } from '../../evenements/theme/ambiances'

export type TypeAction = 'publier' | 'cloturer' | 'annuler' | 'fermer_ventes' | 'rouvrir_ventes' | 'masquer'

interface Props {
  elements: Evenement[]
  surAction: (type: TypeAction, evt: Evenement) => void
}

/** Pastille de date : jour en grand, mois en dessous, dans la couleur de l'événement. */
function PastilleDate({ e }: { e: Evenement }) {
  const d = new Date(e.dateDebut)
  return (
    <div
      className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl leading-none shadow-sm"
      style={{ ...themeDe(e), backgroundImage: 'linear-gradient(135deg, var(--ev-primaire), var(--ev-fonce))', color: 'var(--ev-sur-primaire)' }}
      aria-hidden
    >
      <span className="chiffres text-xl font-extrabold">{d.getDate()}</span>
      <span className="mt-0.5 text-[11px] font-bold uppercase">{d.toLocaleDateString('fr-FR', { month: 'short' })}</span>
    </div>
  )
}

function Remplissage({ e }: { e: Evenement }) {
  if (e.type === 'CADRE') return <span className="text-attenue">—</span>
  if (e.accesLibre) return <span className="text-attenue">Accès libre</span>
  const pct = Math.min(100, Math.round((e.placesReservees / e.capacite) * 100))
  return (
    <div className="w-36">
      <div className="mb-1 flex justify-between text-xs">
        <span className="chiffres font-semibold">
          {e.placesReservees} / {e.capacite}
        </span>
        <span className="chiffres text-attenue">{pct} %</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-neutral-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/** Actions secondaires regroupées dans un menu, pour ne pas écraser la ligne. */
function MenuPlus({ e, surAction }: { e: Evenement; surAction: Props['surAction'] }) {
  const peutMasquer = e.passe || e.statut === 'TERMINE' || e.statut === 'ANNULE'
  const actives = e.statut === 'BROUILLON' || e.statut === 'PUBLIE'
  if (!peutMasquer && !actives) return null
  const item = 'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-neutral-100'
  return (
    <details className="group relative">
      <summary className={`${classeBouton('fantome', 'petit')} list-none [&::-webkit-details-marker]:hidden`} aria-label={`Plus d'actions pour ${e.titre}`}>
        <Icone nom="more_horiz" taille={20} />
      </summary>
      <div className="absolute right-0 z-20 mt-1 w-52 rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-black/10">
        {e.statut === 'PUBLIE' &&
          (e.ventesSuspendues ? (
            <button type="button" className={item} onClick={() => surAction('rouvrir_ventes', e)}>
              <Icone nom="play_arrow" taille={18} /> Rouvrir les ventes
            </button>
          ) : (
            <button type="button" className={item} onClick={() => surAction('fermer_ventes', e)}>
              <Icone nom="pause" taille={18} /> Fermer les ventes
            </button>
          ))}
        {e.statut === 'PUBLIE' && (
          <button type="button" className={item} onClick={() => surAction('cloturer', e)}>
            <Icone nom="flag" taille={18} /> Clôturer
          </button>
        )}
        {peutMasquer && (
          <button type="button" className={item} onClick={() => surAction('masquer', e)}>
            <Icone nom="visibility_off" taille={18} /> Masquer définitivement
          </button>
        )}
        {actives && (
          <button type="button" className={`${item} text-red-600 hover:bg-red-50`} onClick={() => surAction('annuler', e)}>
            <Icone nom="cancel" taille={18} /> Annuler l'événement
          </button>
        )}
      </div>
    </details>
  )
}

/**
 * Tableau des événements : largeur minimale fixe et défilement horizontal (rien n'est compressé),
 * en-tête figé, lignes aérées, actions principales visibles et secondaires dans un menu.
 */
export function TableEvenements({ elements, surAction }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-black/10">
      <div className="max-h-[70vh] overflow-auto">
        <table className="w-full min-w-[1080px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              {['Événement', 'Date', 'Tarif', 'Remplissage', 'Statut', 'Actions'].map((h, i) => (
                <th
                  key={h}
                  scope="col"
                  className={`sticky top-0 z-10 border-b border-neutral-300 bg-neutral-800 px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-white ${i === 5 ? 'text-right' : ''}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&>tr:nth-child(even)]:bg-neutral-50">
            {elements.map((e) => {
              const s = STATUTS_EVENEMENT[e.statut]
              return (
                <tr key={e.id} className="transition-colors hover:bg-indigo-50/60">
                  <td className="border-b border-neutral-200 px-5 py-4">
                    <div className="flex items-center gap-4">
                      <PastilleDate e={e} />
                      <div className="min-w-0">
                        <p className="max-w-[320px] truncate font-bold text-encre">{e.titre}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-attenue">
                          <Icone nom={e.type === 'CADRE' ? 'calendar_view_week' : 'location_on'} taille={14} />
                          {e.type === 'CADRE' ? 'Programme sur plusieurs jours' : (e.lieu ?? 'Lieu non précisé')}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap border-b border-neutral-200 px-5 py-4">
                    <p className="chiffres font-semibold">{new Date(e.dateDebut).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    <p className="chiffres text-xs text-attenue">
                      {heure(e.dateDebut)}
                      {e.dateFin && ` → ${e.type === 'CADRE' ? new Date(e.dateFin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : heure(e.dateFin)}`}
                    </p>
                  </td>
                  <td className="whitespace-nowrap border-b border-neutral-200 px-5 py-4 font-semibold">
                    {e.type === 'CADRE' ? <span className="text-attenue">Par activité</span> : e.prix === 0 ? 'Gratuit' : montant(e.prix, e.devise)}
                  </td>
                  <td className="border-b border-neutral-200 px-5 py-4">
                    <Remplissage e={e} />
                  </td>
                  <td className="whitespace-nowrap border-b border-neutral-200 px-5 py-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge ton={s.ton}>{s.libelle}</Badge>
                      {e.passe && e.statut === 'PUBLIE' && <Badge ton="gris">Passé</Badge>}
                      {e.ventesSuspendues && e.statut === 'PUBLIE' && <Badge ton="orange">Ventes fermées</Badge>}
                    </div>
                  </td>
                  <td className="border-b border-neutral-200 px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {e.statut === 'BROUILLON' && (
                        <Bouton taille="petit" variante="succes" icone="publish" onClick={() => surAction('publier', e)}>
                          Publier
                        </Bouton>
                      )}
                      {(e.statut === 'BROUILLON' || e.statut === 'PUBLIE') && (
                        <Link to={`/admin/evenements/${e.id}`} className={classeBouton('secondaire', 'petit')}>
                          <Icone nom="edit" taille={18} /> Modifier
                        </Link>
                      )}
                      {e.type === 'CADRE' && (
                        <Link to={`/admin/evenements/${e.id}/programme`} className={classeBouton('primaire', 'petit')}>
                          <Icone nom="calendar_view_week" taille={18} /> Programme
                        </Link>
                      )}
                      {e.statut !== 'BROUILLON' && e.type !== 'CADRE' && (
                        <Link to={`/admin/evenements/${e.id}/participants`} className={classeBouton('sombre', 'petit')}>
                          <Icone nom="group" taille={18} /> Participants
                        </Link>
                      )}
                      <MenuPlus e={e} surAction={surAction} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
