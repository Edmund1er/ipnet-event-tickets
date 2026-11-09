import { useEffect, useRef, type ReactNode } from 'react'
import { Icone } from './Icone'
import { Bouton } from './Bouton'

type TonAlerte = 'info' | 'succes' | 'erreur' | 'attention'

const ALERTES: Record<TonAlerte, { classe: string; icone: string }> = {
  info: { classe: 'bg-primaire-clair text-primaire-fonce border-primaire/20', icone: 'info' },
  succes: { classe: 'bg-succes-clair text-green-900 border-succes/30', icone: 'check_circle' },
  erreur: { classe: 'bg-erreur-clair text-red-900 border-erreur/30', icone: 'error' },
  attention: { classe: 'bg-alerte-clair text-orange-900 border-alerte/30', icone: 'warning' },
}

export function Alerte({ ton = 'info', titre, children }: { ton?: TonAlerte; titre?: string; children?: ReactNode }) {
  const a = ALERTES[ton]
  return (
    <div role={ton === 'erreur' ? 'alert' : 'status'} className={`flex gap-3 rounded-xl border p-3.5 text-sm ${a.classe}`}>
      <Icone nom={a.icone} pleine className="mt-0.5 shrink-0" taille={20} />
      <div className="min-w-0">
        {titre && <p className="font-semibold">{titre}</p>}
        {children && <div className={titre ? 'mt-0.5' : ''}>{children}</div>}
      </div>
    </div>
  )
}

export function EtatVide({ icone, titre, texte, action }: { icone: string; titre: string; texte?: string; action?: ReactNode }) {
  return (
    <div className="carte flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primaire-clair text-primaire ring-8 ring-primaire-clair/50">
        <Icone nom={icone} taille={30} />
      </div>
      <h2 className="text-lg font-semibold">{titre}</h2>
      {texte && <p className="mt-1 max-w-md text-sm text-attenue">{texte}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function EnteteSection({
  icone,
  titre,
  sousTitre,
  actions,
}: {
  icone?: string
  titre: string
  sousTitre?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        {icone && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primaire-clair text-primaire">
            <Icone nom={icone} />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-encre sm:text-[28px] sm:leading-9">{titre}</h1>
          {sousTitre && <p className="mt-1 text-sm text-attenue">{sousTitre}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Pagination({
  page,
  totalPages,
  surChangement,
}: {
  page: number
  totalPages: number
  surChangement: (p: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-3">
      <Bouton variante="secondaire" taille="petit" icone="chevron_left" disabled={page === 0} onClick={() => surChangement(page - 1)}>
        Précédent
      </Bouton>
      <span className="chiffres text-sm text-attenue">
        Page {page + 1} / {totalPages}
      </span>
      <Bouton variante="secondaire" taille="petit" disabled={page >= totalPages - 1} onClick={() => surChangement(page + 1)}>
        Suivant
        <Icone nom="chevron_right" taille={20} />
      </Bouton>
    </nav>
  )
}

export function Modale({
  ouverte,
  titre,
  surFermeture,
  children,
  pied,
  large,
}: {
  ouverte: boolean
  titre: string
  surFermeture: () => void
  children: ReactNode
  pied?: ReactNode
  large?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (ouverte && !d.open) d.showModal()
    if (!ouverte && d.open) d.close()
  }, [ouverte])

  return (
    <dialog
      ref={ref}
      onClose={surFermeture}
      onCancel={(e) => {
        e.preventDefault()
        surFermeture()
      }}
      className={`m-auto w-[calc(100%-2rem)] rounded-2xl border border-slate-200 bg-white p-0 text-encre shadow-[0_4px_12px_-2px_rgba(15,23,42,0.08),0_2px_4px_-1px_rgba(15,23,42,0.04)] backdrop:bg-slate-900/50 ${large ? 'max-w-3xl' : 'max-w-lg'}`}
    >
      {ouverte && (
        <>
          <div className="flex items-center justify-between border-b border-bordure px-5 py-4">
            <h2 className="text-lg font-semibold">{titre}</h2>
            <button type="button" onClick={surFermeture} aria-label="Fermer" className="rounded p-1 text-attenue hover:bg-surface">
              <Icone nom="close" />
            </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
          {pied && <div className="flex flex-wrap justify-end gap-2 border-t border-bordure px-5 py-3">{pied}</div>}
        </>
      )}
    </dialog>
  )
}

export function Tuile({
  icone,
  libelle,
  valeur,
  detail,
  ton = 'bleu',
}: {
  icone: string
  libelle: string
  valeur: ReactNode
  detail?: ReactNode
  ton?: 'bleu' | 'rouge' | 'vert' | 'orange'
}) {
  const couleurs = {
    bleu: 'bg-primaire-clair text-primaire',
    rouge: 'bg-rouge-clair text-rouge',
    vert: 'bg-succes-clair text-succes',
    orange: 'bg-alerte-clair text-alerte',
  }[ton]
  return (
    <div className="carte p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${couleurs}`}>
          <Icone nom={icone} />
        </div>
        <p className="titre-section">{libelle}</p>
      </div>
      <p className="chiffres mt-4 font-titre text-4xl font-extrabold text-encre">{valeur}</p>
      {detail && <p className="mt-1 text-sm text-attenue">{detail}</p>}
    </div>
  )
}
