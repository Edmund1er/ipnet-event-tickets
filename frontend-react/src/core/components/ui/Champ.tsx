import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

interface Commun {
  libelle: string
  erreur?: string
  aide?: ReactNode
  facultatif?: boolean
}

function Entete({ id, libelle, facultatif }: { id: string; libelle: string; facultatif?: boolean }) {
  return (
    <label htmlFor={id} className="etiquette">
      {libelle}
      {facultatif && <span className="ml-1 font-normal text-attenue">(facultatif)</span>}
    </label>
  )
}

function Pied({ id, erreur, aide }: { id: string; erreur?: string; aide?: ReactNode }) {
  if (erreur)
    return (
      <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm text-erreur">
        {erreur}
      </p>
    )
  if (aide) return <p id={`${id}-aide`} className="mt-1.5 text-[13px] text-attenue">{aide}</p>
  return null
}

export function Champ({ libelle, erreur, aide, facultatif, className = '', ...reste }: Commun & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <div className={className}>
      <Entete id={id} libelle={libelle} facultatif={facultatif} />
      <input
        id={id}
        aria-invalid={!!erreur || undefined}
        aria-describedby={erreur ? `${id}-err` : aide ? `${id}-aide` : undefined}
        className={`champ ${erreur ? '!border-erreur' : ''}`}
        {...reste}
      />
      <Pied id={id} erreur={erreur} aide={aide} />
    </div>
  )
}

export function ChampTexte({ libelle, erreur, aide, facultatif, className = '', ...reste }: Commun & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <div className={className}>
      <Entete id={id} libelle={libelle} facultatif={facultatif} />
      <textarea
        id={id}
        aria-invalid={!!erreur || undefined}
        className={`champ !h-auto min-h-28 py-2.5 ${erreur ? '!border-erreur' : ''}`}
        {...reste}
      />
      <Pied id={id} erreur={erreur} aide={aide} />
    </div>
  )
}

export function ChampSelection({
  libelle,
  erreur,
  aide,
  facultatif,
  className = '',
  children,
  ...reste
}: Commun & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId()
  return (
    <div className={className}>
      <Entete id={id} libelle={libelle} facultatif={facultatif} />
      <select id={id} aria-invalid={!!erreur || undefined} className={`champ ${erreur ? '!border-erreur' : ''}`} {...reste}>
        {children}
      </select>
      <Pied id={id} erreur={erreur} aide={aide} />
    </div>
  )
}
