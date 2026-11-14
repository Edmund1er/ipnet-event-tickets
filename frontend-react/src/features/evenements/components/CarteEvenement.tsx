import { Link } from 'react-router-dom'
import type { Evenement } from '../../../core/api/types'
import { Icone } from '../../../core/components/ui/Icone'
import { dateLongue, montant } from '../../../core/utils/format'
import { urlImageEvenement } from '../services/evenementService'
import { themeDe } from '../theme/ambiances'

// Photo Unsplash (photo-1492684223066-81342ee5ff30), locale pour éviter un appel réseau tiers à l'affichage.
const IMAGE_EVENEMENT_DEFAUT = '/event-card-default.jpg'

export function VisuelEvenement({ evenement, className = '' }: { evenement: Evenement; className?: string }) {
  // Photo locale par défaut, remplacée dès que l'organisateur fournit son propre visuel.
  const src = evenement.aImage ? urlImageEvenement(evenement.id) : IMAGE_EVENEMENT_DEFAUT
  return <img src={src} alt="" loading="lazy" className={`object-cover ${className}`} />
}

export function JaugePlaces({ evenement }: { evenement: Evenement }) {
  const pct = Math.min(100, Math.round((evenement.placesReservees / evenement.capacite) * 100))
  const complet = evenement.placesRestantes === 0
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className={`font-semibold ${complet ? 'text-rouge' : 'text-encre'}`}>
          {complet ? 'Complet' : `${evenement.placesRestantes} place${evenement.placesRestantes > 1 ? 's' : ''} restante${evenement.placesRestantes > 1 ? 's' : ''}`}
        </span>
        <span className="chiffres text-attenue">
          {evenement.placesReservees} / {evenement.capacite}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-primaire-clair" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Taux de remplissage">
        <div className={`h-full rounded-full ${pct >= 90 ? 'bg-rouge' : 'bg-primaire'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function CarteEvenement({ evenement }: { evenement: Evenement }) {
  return (
    <Link
      to={`/evenements/${evenement.id}`}
      className="carte-service group transition duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={themeDe(evenement)}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900">
        <VisuelEvenement evenement={evenement} className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
        <span className="absolute left-4 top-4 rounded-full bg-black/45 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
          {evenement.type === 'CADRE' ? 'Programme' : 'Événement'}
        </span>
        <span className="absolute right-0 top-4 rounded-l bg-white px-4 py-1.5 text-sm font-bold text-encre shadow-md">
          {evenement.type === 'CADRE' ? 'Programme' : evenement.prix === 0 ? 'Gratuit' : montant(evenement.prix, evenement.devise)}
        </span>
      </div>
      <div className="relative flex flex-1 flex-col gap-3 px-6 pb-6 pt-10">
        <div className="icone-carre absolute -top-7 left-6 shadow-lg">
          <Icone nom="event" taille={26} />
        </div>
        <h2 className="text-balance text-lg font-bold leading-snug text-encre transition-colors group-hover:text-rouge">{evenement.titre}</h2>
        <div className="flex flex-col gap-1.5 text-sm text-attenue">
          <p className="flex items-center gap-2">
            <Icone nom="calendar_month" taille={18} className="text-rouge" />
            {dateLongue(evenement.dateDebut)}
          </p>
          {evenement.lieu && (
            <p className="flex items-center gap-2">
              <Icone nom="location_on" taille={18} className="text-rouge" />
              {evenement.lieu}
            </p>
          )}
        </div>
        {evenement.type !== 'CADRE' && !evenement.accesLibre && (
          <div className="mt-auto pt-2">
            <JaugePlaces evenement={evenement} />
          </div>
        )}
      </div>
    </Link>
  )
}
