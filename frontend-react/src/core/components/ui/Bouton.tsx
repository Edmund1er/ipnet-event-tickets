import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icone } from './Icone'
import { Chargement } from './Chargement'

export type VarianteBouton = 'primaire' | 'secondaire' | 'danger' | 'fantome' | 'rouge' | 'succes' | 'sombre'
export type TailleBouton = 'normal' | 'grand' | 'petit'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBouton
  icone?: string
  enCours?: boolean
  taille?: TailleBouton
  children?: ReactNode
}

/** « rouge » désigne la couleur de l'événement affiché : classe .btn-theme. */
const VARIANTES: Record<VarianteBouton, string> = {
  primaire: 'btn-primaire',
  rouge: 'btn-theme',
  succes: 'btn-succes',
  sombre: 'btn-sombre',
  secondaire: 'btn-secondaire',
  danger: 'btn-danger',
  fantome: 'btn-fantome',
}
const TAILLES: Record<TailleBouton, string> = { petit: 'btn-petit', normal: '', grand: 'btn-grand' }

/** Classes d'un bouton, utilisables aussi sur un <Link> pour un rendu strictement identique. */
export function classeBouton(variante: VarianteBouton = 'primaire', taille: TailleBouton = 'normal', extra = '') {
  return `btn ${VARIANTES[variante]} ${TAILLES[taille]} ${extra}`.trim()
}

export function Bouton({
  variante = 'primaire',
  icone,
  enCours,
  taille = 'normal',
  className = '',
  children,
  disabled,
  type = 'button',
  ...reste
}: Props) {
  return (
    <button type={type} disabled={disabled || enCours} aria-busy={enCours || undefined} className={classeBouton(variante, taille, className)} {...reste}>
      {enCours ? <Chargement taille={18} clair={variante !== 'secondaire' && variante !== 'fantome'} /> : icone && <Icone nom={icone} taille={20} />}
      {children}
    </button>
  )
}
