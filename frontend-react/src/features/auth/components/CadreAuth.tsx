import type { ReactNode } from 'react'
import { CalendarDays, Music2, Sparkles, TicketCheck } from 'lucide-react'
import { Icone } from '../../../core/components/ui/Icone'

const ATOUTS = [
  { icone: TicketCheck, texte: 'Réserve en quelques clics' },
  { icone: CalendarDays, texte: 'Garde le programme à portée de main' },
  { icone: Sparkles, texte: 'Entre avec ton billet QR' },
]

/** Cadre d’authentification immersif; conserve les vrais formulaires et actions métier enfants. */
export function CadreAuth({ icone, titre, sousTitre, children, large }: { icone: string; titre: string; sousTitre?: ReactNode; children: ReactNode; large?: boolean }) {
  return (
    <div className={`auth-card apparition mx-auto w-full ${large ? 'max-w-6xl' : 'max-w-5xl'}`}>
      <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white shadow-[0_32px_100px_-38px_rgba(0,0,0,.75)] lg:grid lg:grid-cols-[.92fr_1.08fr]">
        <aside className="auth-story relative hidden min-h-[620px] flex-col justify-between overflow-hidden p-9 text-white lg:flex xl:p-12">
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_20%,rgba(217,70,239,.32),transparent_42%),radial-gradient(ellipse_at_10%_90%,rgba(255,101,61,.28),transparent_44%),linear-gradient(150deg,#12121b,#08090e_68%)]" />
          <div aria-hidden="true" className="auth-story-ring absolute -right-16 top-24 h-72 w-72 rounded-full border border-white/15" />
          <div aria-hidden="true" className="absolute -right-3 top-36 h-48 w-48 rounded-full border border-white/10" />
          <div className="relative z-10">
            <p className="font-titre text-xl font-extrabold tracking-tight">IPNET<span className="text-[#ff653d]">·</span>Events</p>
            <p className="mt-2 text-sm text-white/60">Les sorties de la jeunesse, en un seul endroit.</p>
          </div>
          <div className="relative z-10 py-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-lime-200 shadow-lg shadow-black/20 backdrop-blur">
              <Music2 aria-hidden="true" className="h-8 w-8" />
            </div>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-lime-200">La nuit est à toi</p>
            <h2 className="mt-3 max-w-[11ch] font-titre text-4xl font-extrabold leading-[1.05] tracking-tight xl:text-5xl">Les meilleurs souvenirs se vivent ensemble.</h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">Soirée rap, gospel, bal ou journée plage : retrouve ta team et profite du moment.</p>
          </div>
          <ul className="relative z-10 flex flex-col gap-3">
            {ATOUTS.map(({ icone: Ic, texte }) => (
              <li key={texte} className="flex items-center gap-3 text-sm font-medium text-white/80">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lime-200"><Ic aria-hidden="true" className="h-4 w-4" /></span>
                {texte}
              </li>
            ))}
          </ul>
          <p className="relative z-10 mt-8 text-xs text-white/40">© {new Date().getFullYear()} IPNET Events · Lomé</p>
        </aside>

        <section className="auth-form-panel flex min-w-0 flex-col justify-center p-5 sm:p-9 lg:p-12">
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#17171d] text-lime-300"><Music2 aria-hidden="true" className="h-5 w-5" /></span>
            <span className="font-titre text-base font-extrabold text-[#17171d]">IPNET<span className="text-[#ff653d]">·</span>Events</span>
          </div>
          <div className="mb-7 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#17171d] text-lime-300 shadow-lg shadow-black/10">
              <Icone nom={icone} taille={24} />
            </div>
            <div className="min-w-0 pt-0.5">
              <h1 className="font-titre text-2xl font-extrabold leading-tight tracking-tight text-[#17171d] sm:text-3xl">{titre}</h1>
              {sousTitre && <p className="mt-1 text-sm leading-relaxed text-neutral-500">{sousTitre}</p>}
            </div>
          </div>
          {children}
        </section>
      </div>
    </div>
  )
}
