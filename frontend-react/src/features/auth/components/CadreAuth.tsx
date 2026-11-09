import type { ReactNode } from 'react'
import { Icone } from '../../../core/components/ui/Icone'

/** Carte centrée des écrans d'authentification, avec bandeau aux couleurs IPNET. */
export function CadreAuth({ icone, titre, sousTitre, children, large }: { icone: string; titre: string; sousTitre?: ReactNode; children: ReactNode; large?: boolean }) {
  return (
    <div className={`mx-auto w-full ${large ? 'max-w-2xl' : 'max-w-md'}`}>
      <div className="carte overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-primaire via-primaire to-rouge" />
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primaire-clair text-primaire">
              <Icone nom={icone} />
            </div>
            <div>
              <h1 className="text-[22px] font-bold leading-7">{titre}</h1>
              {sousTitre && <p className="text-sm text-attenue">{sousTitre}</p>}
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
