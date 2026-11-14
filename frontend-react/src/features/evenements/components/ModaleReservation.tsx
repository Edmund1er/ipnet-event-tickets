import { Link } from 'react-router-dom'
import type { Evenement } from '../../../core/api/types'
import { classeBouton } from '../../../core/components/ui/Bouton'
import { Modale } from '../../../core/components/ui/Divers'
import { Icone } from '../../../core/components/ui/Icone'
import { montant } from '../../../core/utils/format'

interface Props {
  evenement: Evenement
  /** Pass d'un programme multi-jours. */
  passes: Evenement[]
  ouverte: boolean
  surFermeture: () => void
  /** Réservation d'un événement simple (bloc complet, déjà prêt). */
  reservation: React.ReactNode
}

/** Fenêtre de réservation ouverte depuis la page : réservation directe, ou choix d'un pass pour un programme. */
export function ModaleReservation({ evenement, passes, ouverte, surFermeture, reservation }: Props) {
  const programme = evenement.type === 'CADRE'
  return (
    <Modale ouverte={ouverte} titre={programme ? 'Choisissez votre pass' : evenement.prix === 0 ? 'Inscription' : 'Réservation'} surFermeture={surFermeture}>
      {programme ? (
        passes.length === 0 ? (
          <p className="text-attenue">
            Il n'y a pas de pass pour ce programme : choisissez une activité dans le programme et réservez-la directement.
          </p>
        ) : (
          <ul className="divide-y divide-black/10">
            {passes.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-bold">{p.titre}</p>
                  <p className="text-sm text-attenue">{p.passPortee === 'JOURNEE' ? 'Valable un jour' : 'Valable pendant tout le programme'}</p>
                </div>
                <Link to={`/evenements/${p.id}`} className={classeBouton('rouge', 'normal')} onClick={surFermeture}>
                  {montant(p.prix, p.devise)} <Icone nom="arrow_forward" taille={18} />
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : (
        reservation
      )}
    </Modale>
  )
}
