import type { ReactNode } from 'react'
import { LogoImage } from '../../../core/components/layout/Logo'
import { Icone } from '../../../core/components/ui/Icone'

/**
 * Écran d'authentification : carte centrée sur mobile, et à partir de lg un panneau de marque
 * (logo IP EVENTS) à gauche du formulaire.
 */
export function CadreAuth({ icone, titre, sousTitre, children, large }: { icone: string; titre: string; sousTitre?: ReactNode; children: ReactNode; large?: boolean }) {
  return (
    <div className={`mx-auto w-full ${large ? 'max-w-4xl' : 'max-w-md lg:max-w-4xl'}`}>
      <div className="carte overflow-hidden shadow-xl shadow-primaire/5 lg:grid lg:grid-cols-[5fr_6fr]">
        <aside className="relative hidden flex-col items-center justify-center gap-6 overflow-hidden bg-gradient-to-br from-primaire-clair via-white to-rouge-clair p-8 lg:flex">
          <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-primaire/10 blur-2xl" aria-hidden />
          <div className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-rouge/10 blur-2xl" aria-hidden />
          <LogoImage className="relative w-full max-w-[18rem]" />
          <p className="relative max-w-[16rem] text-center text-sm leading-relaxed text-attenue">
            La billetterie officielle des événements d'IPNET Institute of Technology.
          </p>
        </aside>
        <div>
          <div className="h-1.5 bg-gradient-to-r from-primaire via-primaire to-rouge lg:hidden" />
          <div className="p-5 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primaire text-white shadow-md shadow-primaire/30">
                <Icone nom={icone} />
              </div>
              <div className="min-w-0">
                <h1 className="text-[22px] font-extrabold leading-7 tracking-tight">{titre}</h1>
                {sousTitre && <p className="text-sm text-attenue">{sousTitre}</p>}
              </div>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
