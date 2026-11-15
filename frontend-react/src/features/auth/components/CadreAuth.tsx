import type { ReactNode } from 'react'
import { Icone } from '../../../core/components/ui/Icone'

const ATOUTS = [
  { icone: 'confirmation_number', texte: 'Réserve ta place en quelques clics' },
  { icone: 'smartphone', texte: 'Paie par Mobile Money si l’événement est payant' },
  { icone: 'qr_code_2', texte: 'Retrouve ton billet QR quand il est prévu' },
]

/** Cadre d’authentification dans le style ScrewFast; garde les formulaires réels et leur largeur. */
export function CadreAuth({ icone, titre, sousTitre, children, large }: { icone: string; titre: string; sousTitre?: ReactNode; children: ReactNode; large?: boolean }) {
  return (
    <div className={`auth-card apparition mx-auto w-full ${large ? 'max-w-6xl' : 'max-w-5xl'}`}>
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 lg:grid lg:grid-cols-[.92fr_1.08fr]">
        <aside className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden bg-neutral-800 p-9 text-white lg:flex xl:p-12">
          <img src="/logo_ipnet.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-45" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-neutral-900/45 via-neutral-900/70 to-neutral-900/90" />
          <div className="relative z-10">
            <p className="font-titre text-2xl font-bold tracking-tight">IPNET<span className="text-yellow-400">·</span>Events</p>
            <p className="mt-2 text-sm text-white/80">Les sorties, concerts et fêtes de la jeunesse à Lomé.</p>
          </div>
          <div className="relative z-10 py-8">
            <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-orange-400 text-white shadow-sm">
              <Icone nom="music_note" taille={26} />
            </span>
            <h2 className="max-w-[12ch] font-titre text-4xl font-bold leading-tight tracking-tight xl:text-5xl">Les bons moments se vivent ensemble.</h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/80">Choisis ta sortie, retrouve ta bande et profite du moment.</p>
          </div>
          <ul className="relative z-10 flex flex-col gap-3">
            {ATOUTS.map((a) => (
              <li key={a.texte} className="flex items-center gap-3 text-sm text-white/90">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-yellow-300">
                  <Icone nom={a.icone} taille={20} />
                </span>
                {a.texte}
              </li>
            ))}
          </ul>
          <p className="relative z-10 mt-8 text-xs text-white/60">© {new Date().getFullYear()} IPNET Events · Lomé</p>
        </aside>

        <section className="auth-form-panel min-w-0 bg-neutral-100 p-5 dark:bg-neutral-800 sm:p-9 lg:p-12">
          <div className="relative mb-6 h-24 overflow-hidden rounded-lg lg:hidden">
            <img src="/logo_ipnet.jpg" alt="IPNET Events" className="h-full w-full object-cover object-center" />
          </div>
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-orange-400 text-white shadow-sm">
              <Icone nom={icone} taille={23} />
            </div>
            <h1 className="font-titre text-2xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100 sm:text-3xl">{titre}</h1>
            {sousTitre && <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{sousTitre}</p>}
          </div>
          {children}
        </section>
      </div>
    </div>
  )
}
