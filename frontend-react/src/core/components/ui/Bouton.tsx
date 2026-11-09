import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icone } from './Icone'
import { Chargement } from './Chargement'

type Variante = 'primaire' | 'secondaire' | 'danger' | 'fantome' | 'rouge'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  icone?: string
  enCours?: boolean
  taille?: 'normal' | 'grand' | 'petit'
  children?: ReactNode
}

const STYLES: Record<Variante, string> = {
  primaire: 'bg-primaire text-white shadow-sm shadow-primaire/30 hover:bg-primaire-fonce disabled:bg-primaire/50 disabled:shadow-none',
  rouge: 'bg-rouge text-white shadow-sm shadow-rouge/30 hover:bg-rouge-fonce disabled:bg-rouge/50 disabled:shadow-none',
  secondaire:
    'bg-white text-primaire border-[1.5px] border-primaire hover:bg-primaire-clair disabled:text-primaire/50 disabled:border-primaire/40',
  danger: 'bg-erreur-clair text-erreur border border-erreur hover:bg-erreur hover:text-white disabled:opacity-50',
  fantome: 'bg-transparent text-attenue hover:bg-primaire-clair hover:text-primaire disabled:opacity-50',
}

const TAILLES = {
  petit: 'h-9 px-3 text-sm gap-1.5',
  normal: 'h-11 px-4 text-[15px] gap-2',
  grand: 'h-[52px] px-6 text-base gap-2',
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
    <button
      type={type}
      disabled={disabled || enCours}
      aria-busy={enCours || undefined}
      className={`inline-flex items-center justify-center rounded-xl font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed ${STYLES[variante]} ${TAILLES[taille]} ${className}`}
      {...reste}
    >
      {enCours ? <Chargement taille={18} clair={variante === 'primaire' || variante === 'rouge'} /> : icone && <Icone nom={icone} taille={20} />}
      {children}
    </button>
  )
}
