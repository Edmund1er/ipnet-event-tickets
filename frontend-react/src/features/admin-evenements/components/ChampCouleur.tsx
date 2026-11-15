import { useId } from 'react'

interface Props {
  libelle: string
  valeur?: string | null
  defaut: string
  surChangement: (couleur: string | null) => void
}

/** Couleur optionnelle : absente, la zone hérite du thème du modèle. */
export function ChampCouleur({ libelle, valeur, defaut, surChangement }: Props) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold">
      <label htmlFor={id}>
        {libelle}
        <small className="block font-normal text-attenue">{valeur ? 'Personnalisée' : 'Hérite du thème'}</small>
      </label>
      <span className="flex items-center gap-2">
        <input id={id} aria-label={libelle} type="color" value={valeur ?? defaut} onChange={(e) => surChangement(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-neutral-300 bg-white p-0.5" />
        {valeur && <button type="button" onClick={() => surChangement(null)} className="text-[11px] text-primaire underline">Hériter</button>}
      </span>
    </div>
  )
}
