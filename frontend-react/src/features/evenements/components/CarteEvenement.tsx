import { ArrowRight, CalendarDays, MapPin, Sparkles, Ticket } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { Evenement } from '../../../core/api/types'
import { montant, dateLongue } from '../../../core/utils/format'
import { urlImageEvenement } from '../services/evenementService'
import { themeDe } from '../theme/ambiances'
import { categorieDe } from '../theme/categories'
import { modeleDe } from '../site/types'

/** Affiche l'affiche de l'organisateur, sinon une composition graphique adaptée à son ambiance. */
export function VisuelEvenement({ evenement, className = '' }: { evenement: Evenement; className?: string }) {
  const plage = evenement.ambiance === 'PLAGE' || evenement.modele === 'RENCONTRE'
  const nature = evenement.ambiance === 'NATURE' || evenement.modele === 'ATELIER'
  return (
    <div
      aria-hidden="true"
      data-vibe-art={evenement.ambiance ?? evenement.modele ?? 'FESTIF'}
      className={`event-vibe-art absolute inset-0 overflow-hidden ${className}`}
      style={{
        ...(themeDe(evenement) as CSSProperties),
        backgroundImage: 'radial-gradient(ellipse at 78% 24%, color-mix(in srgb, var(--ev-primaire) 64%, transparent), transparent 36%), radial-gradient(ellipse at 18% 82%, color-mix(in srgb, var(--ev-primaire) 38%, transparent), transparent 44%), linear-gradient(135deg,#101116 0%,#181722 58%,#08090e 100%)',
      }}
    >
      <div className="event-vibe-orb absolute -right-16 -top-20 h-72 w-72 rounded-full border border-white/15" />
      <div className="event-vibe-orb absolute -right-4 top-[-2.5rem] h-52 w-52 rounded-full border border-white/10" />
      <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'repeating-linear-gradient(118deg, transparent 0 27px, rgba(255,255,255,.14) 28px, transparent 29px 54px)' }} />
      {plage ? (
        <div aria-hidden="true" className="absolute inset-0">
          <span className="absolute right-[16%] top-[18%] h-20 w-20 rounded-full bg-yellow-300/90 shadow-[0_0_55px_rgba(253,224,71,.5)] sm:h-28 sm:w-28" />
          <svg viewBox="0 0 800 420" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-3/5 w-full opacity-70">
            <path d="M0 115 C130 55 230 175 370 115 S610 55 800 115 V420 H0Z" fill="#06b6d4" />
            <path d="M0 180 C130 120 230 240 370 180 S610 120 800 180" fill="none" stroke="#cffafe" strokeWidth="9" />
            <path d="M0 245 C130 185 230 305 370 245 S610 185 800 245" fill="none" stroke="#f0fdff" strokeWidth="6" />
          </svg>
        </div>
      ) : nature ? (
        <svg aria-hidden="true" viewBox="0 0 800 420" preserveAspectRatio="none" className="absolute inset-0 h-full w-full opacity-50">
          <circle cx="640" cy="90" r="54" fill="#bef264" />
          <path d="M0 330 180 150 310 290 465 100 650 290 735 210 800 270 V420H0Z" fill="#65a30d" />
          <path d="M0 365 185 245 310 330 480 190 635 335 755 255 800 290 V420H0Z" fill="#14532d" />
          <path d="M130 285 185 170 240 285M575 305 630 190 685 305" fill="none" stroke="#f7fee7" strokeWidth="10" strokeLinecap="round" />
        </svg>
      ) : (
        <div className="absolute bottom-8 right-8 flex h-28 items-end gap-2 opacity-45" aria-hidden="true">
          {[30, 52, 38, 76, 46, 92, 58, 34].map((height, index) => (
            <span key={index} className="w-2 rounded-t-full bg-white/75" style={{ height }} />
          ))}
        </div>
      )}
      {evenement.aImage && (
        <img
          src={urlImageEvenement(evenement.id)}
          alt=""
          loading="lazy"
          decoding="async"
          onError={(event) => event.currentTarget.remove()}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/35" />
    </div>
  )
}

export function JaugePlaces({ evenement }: { evenement: Evenement }) {
  const pct = Math.min(100, Math.round((evenement.placesReservees / evenement.capacite) * 100))
  const complet = evenement.placesRestantes === 0
  return (
    <div className="w-full">
      <div className="mb-1 flex justify-between gap-2 text-xs">
        <span className={`font-semibold ${complet ? 'text-red-700' : 'text-neutral-700'}`}>
          {complet ? 'Complet' : `${evenement.placesRestantes} place${evenement.placesRestantes > 1 ? 's' : ''} restante${evenement.placesRestantes > 1 ? 's' : ''}`}
        </span>
        <span className="chiffres text-neutral-500">{evenement.placesReservees} / {evenement.capacite}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Taux de remplissage">
        <div className={`h-full rounded-full ${pct >= 90 ? 'bg-red-500' : 'bg-orange-400'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function CarteEvenement({ evenement }: { evenement: Evenement }) {
  const type = modeleDe(evenement.modele)
  const categorie = evenement.categorie ? categorieDe(evenement.categorie).libelle : null
  const etiquette = type?.nom ?? categorie ?? (evenement.type === 'CADRE' ? 'Programme festif' : 'Fête & sortie')
  const prix = evenement.type === 'CADRE' ? 'Pass disponibles' : evenement.accesLibre || evenement.prix === 0 ? 'Gratuit' : montant(evenement.prix, evenement.devise)
  return (
    <Link
      to={`/evenements/${evenement.id}`}
      aria-label={`${evenement.titre} — ${dateLongue(evenement.dateDebut)}${evenement.lieu ? `, ${evenement.lieu}` : ''}`}
      className="group flex h-full min-h-[340px] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
    >
      <div className="relative h-44 shrink-0 overflow-hidden bg-neutral-900 sm:h-48">
        <VisuelEvenement evenement={evenement} className="transition-transform duration-500 group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3.5">
          <span className="inline-flex max-w-[72%] items-center gap-1.5 rounded-md border border-white/25 bg-neutral-900/60 px-2.5 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-yellow-300" />{etiquette}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-yellow-400 px-2.5 py-1.5 text-xs font-bold text-neutral-900 shadow-sm">
            <Ticket aria-hidden="true" className="h-3.5 w-3.5" />{prix}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-neutral-600">
          <span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="h-4 w-4 text-orange-500" />{dateLongue(evenement.dateDebut)}</span>
          {evenement.lieu && <span className="inline-flex items-center gap-1.5"><MapPin aria-hidden="true" className="h-4 w-4 text-orange-500" />{evenement.lieu}</span>}
        </div>
        <h2 className="mt-3 line-clamp-2 text-balance font-titre text-xl font-bold leading-snug text-neutral-800 sm:text-2xl">{evenement.titre}</h2>
        {evenement.type !== 'CADRE' && !evenement.accesLibre && <div className="mt-4"><JaugePlaces evenement={evenement} /></div>}
        <div className="mt-auto flex items-center justify-between border-t border-neutral-200 pt-4 text-sm font-semibold text-orange-600">
          <span>Découvrir l’événement</span>
          <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  )
}
