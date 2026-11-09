import type { Evenement } from '../../../core/api/types'
import { Icone } from '../../../core/components/ui/Icone'
import { dateCourte, heure } from '../../../core/utils/format'

/** Bloc « Événement actif » de la maquette. */
export function SelecteurEvenement({
  evenements,
  evenement,
  surChoix,
}: {
  evenements: Evenement[]
  evenement: Evenement | null
  surChoix: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-primaire-clair p-2 pl-3">
      <Icone nom="event" className="text-primaire" />
      <div className="min-w-0 flex-1">
        <label htmlFor="evt-actif" className="block text-[10px] font-bold uppercase tracking-wider text-attenue">
          Événement actif
        </label>
        <select
          id="evt-actif"
          value={evenement?.id ?? ''}
          onChange={(e) => surChoix(e.target.value)}
          className="w-full truncate bg-transparent text-[15px] font-semibold text-encre outline-none"
        >
          <option value="">Choisir l'événement…</option>
          {evenements.map((e) => (
            <option key={e.id} value={e.id}>
              {e.titre} — {dateCourte(e.dateDebut)} {heure(e.dateDebut)}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
