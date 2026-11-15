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
      <div className="absolute bottom-12 right-8 flex h-36 items-end gap-2 opacity-50" aria-hidden="true">
        {[38, 64, 48, 94, 58, 112, 74, 44].map((height, index) => (
          <span key={index} className="w-2 rounded-t-full bg-white/75" style={{ height }} />
        ))}
      </div>
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
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-black/10 to-black/60" />
    </div>
  )
}

export function JaugePlaces({ evenement }: { evenement: Evenement }) {
  const pct = Math.min(100, Math.round((evenement.placesReservees / evenement.capacite) * 100))
  const complet = evenement.placesRestantes === 0
  return (
    <div className="w-full">
      <div className="mb-1 flex justify-between gap-2 text-xs">
        <span className={`font-semibold ${complet ? 'text-rose-200' : 'text-white'}`}>
          {complet ? 'Complet' : `${evenement.placesRestantes} place${evenement.placesRestantes > 1 ? 's' : ''} restante${evenement.placesRestantes > 1 ? 's' : ''}`}
        </span>
        <span className="chiffres text-white/75">{evenement.placesReservees} / {evenement.capacite}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/25" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Taux de remplissage">
        <div className={`h-full rounded-full ${pct >= 90 ? 'bg-rose-300' : 'bg-lime-300'}`} style={{ width: `${pct}%` }} />
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
      className="group relative isolate flex min-h-[390px] overflow-hidden rounded-[1.4rem] bg-[#101116] text-white shadow-[0_20px_55px_-24px_rgba(12,10,20,.7)] ring-1 ring-black/10 transition duration-500 hover:-translate-y-1 hover:shadow-[0_28px_70px_-25px_rgba(12,10,20,.82)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-400"
    >
      <VisuelEvenement evenement={evenement} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />
      <div className="relative z-10 flex min-h-[390px] w-full flex-col justify-between p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex max-w-[72%] items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-lime-300" />{etiquette}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-extrabold text-neutral-950 shadow-lg">
            <Ticket aria-hidden="true" className="h-4 w-4" />{prix}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-white/90 sm:text-sm">
            <span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="h-4 w-4 text-lime-300" />{dateLongue(evenement.dateDebut)}</span>
            {evenement.lieu && <span className="inline-flex items-center gap-1.5"><MapPin aria-hidden="true" className="h-4 w-4 text-orange-300" />{evenement.lieu}</span>}
          </div>
          <h2 className="max-w-[22ch] text-balance text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">{evenement.titre}</h2>
          {evenement.type !== 'CADRE' && !evenement.accesLibre && <JaugePlaces evenement={evenement} />}
          <div className="mt-1 flex items-center justify-between rounded-xl border border-white/25 bg-white/10 px-4 py-3 backdrop-blur-md transition group-hover:border-white/45 group-hover:bg-white/20">
            <span className="text-sm font-bold">Découvrir l’événement</span>
            <ArrowRight aria-hidden="true" className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  )
}
