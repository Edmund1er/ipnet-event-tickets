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
      <div className="carte overflow-hidden shadow-xl shadow-primaire/5 lg:grid lg:grid-cols-[1fr_1fr] items-stretch">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primaire-fonce via-primaire to-[#0a2342] p-8 text-white lg:flex">
          {/* Image en fond dégradé sur toute la hauteur du bloc */}
          <div className="absolute inset-0" aria-hidden>
            <img
              src="/logo_ipnet.jpg"
              alt=""
              className="h-full w-full object-cover object-center opacity-25 mix-blend-luminosity scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a2342]/90 via-primaire/60 to-[#0a2342]/70" />
          </div>

          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur border border-white/20 text-white">
              <Icone nom="confirmation_number" taille={16} /> IPNET Events
            </span>
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center py-6 text-center">
            <LogoImage className="w-full max-w-[15rem] drop-shadow-xl" />
            <h2 className="mt-4 text-xl font-bold tracking-tight text-white">Billetterie Événements</h2>
            <p className="mt-2 max-w-[17rem] text-xs leading-relaxed text-blue-100/90">
              Plateforme officielle de réservation, paiement sécurisé et contrôle d'accès d'IPNET Institute of Technology.
            </p>
          </div>

          <div className="relative z-10 text-center text-[11px] text-blue-200/60">
            © {new Date().getFullYear()} IPNET Institute of Technology
          </div>
        </aside>
        <div className="flex flex-col justify-center">
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
