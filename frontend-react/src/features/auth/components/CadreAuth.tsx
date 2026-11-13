import type { ReactNode } from 'react'
import { Icone } from '../../../core/components/ui/Icone'

const ATOUTS = [
  { icone: 'confirmation_number', texte: 'Réservez votre place en quelques clics' },
  { icone: 'smartphone', texte: 'Payez par Mobile Money' },
  { icone: 'qr_code_2', texte: 'Recevez votre billet QR code par e-mail' },
]

/**
 * Écran d'authentification (gabarit Dewi) : carte blanche aux angles francs posée sur le fond bleu nuit de la page ;
 * à partir de lg, un panneau de marque à gauche et le formulaire à droite.
 */
export function CadreAuth({ icone, titre, sousTitre, children, large }: { icone: string; titre: string; sousTitre?: ReactNode; children: ReactNode; large?: boolean }) {
  return (
    <div className={`apparition mx-auto w-full ${large ? 'max-w-5xl' : 'max-w-md lg:max-w-5xl'}`}>
      <div className="overflow-hidden rounded-lg bg-white shadow-2xl shadow-black/30 lg:grid lg:grid-cols-[2fr_3fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-nuit p-9 text-white lg:flex">
          <img src="/logo_ipnet.jpg" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-nuit/80 via-nuit/70 to-nuit/95" aria-hidden />
          <div className="relative z-10">
            <p className="font-titre text-2xl font-extrabold tracking-tight">
              IPNET<span className="text-rouge-vif">·</span>Events
            </p>
            <p className="mt-1 text-sm text-white/70">Billetterie officielle</p>
          </div>
          <ul className="relative z-10 flex flex-col gap-5 py-8">
            {ATOUTS.map((a) => (
              <li key={a.texte} className="flex items-center gap-3 text-sm text-white/90">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rouge text-white">
                  <Icone nom={a.icone} taille={22} />
                </span>
                {a.texte}
              </li>
            ))}
          </ul>
          <p className="relative z-10 text-[11px] text-white/50">© {new Date().getFullYear()} IPNET Institute of Technology</p>
        </aside>
        <div className="flex flex-col justify-center">
          <div className="h-1 bg-rouge lg:hidden" />
          <div className="p-6 sm:p-10">
            <div className="mb-7 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-rouge text-white">
                <Icone nom={icone} taille={26} />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold leading-tight tracking-tight text-encre">{titre}</h1>
                {sousTitre && <p className="mt-0.5 text-sm text-attenue">{sousTitre}</p>}
              </div>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
