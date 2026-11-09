import type { Ton } from '../../constants/statuts'

const TONS: Record<Ton, string> = {
  bleu: 'bg-primaire-clair text-primaire',
  vert: 'bg-succes-clair text-succes',
  orange: 'bg-alerte-clair text-alerte',
  rouge: 'bg-rouge-clair text-rouge',
  gris: 'bg-slate-100 text-slate-600',
  violet: 'bg-violet-100 text-violet-700',
}

/** Pastille de statut (maquette : label-sm majuscule, padding 4/8). */
export function Badge({ ton, children }: { ton: Ton; children: React.ReactNode }) {
  return (
    <span
      role="status"
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${TONS[ton]}`}
    >
      {children}
    </span>
  )
}
