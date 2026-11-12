import { Link } from 'react-router-dom'
import type { Evenement } from '../../../core/api/types'
import { Icone } from '../../../core/components/ui/Icone'
import { dateLongue, montant } from '../../../core/utils/format'
import { urlImageEvenement } from '../services/evenementService'

export function VisuelEvenement({ evenement, className = '' }: { evenement: Evenement; className?: string }) {
  // Les images sont ajoutées par l'administrateur : sans image, on n'affiche rien.
  if (!evenement.aImage) return null
  return <img src={urlImageEvenement(evenement.id)} alt="" loading="lazy" className={`object-cover ${className}`} />
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
      className="carte group flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primaire/15"
    >
      {evenement.aImage && (
        <div className="relative overflow-hidden">
          <VisuelEvenement evenement={evenement} className="aspect-[16/9] w-full transition-transform duration-500 group-hover:scale-105" />
          <span className="absolute left-3 top-3 rounded-full bg-rouge px-3 py-1 text-sm font-bold text-white shadow-md">
            {montant(evenement.prix, evenement.devise)}
          </span>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        {!evenement.aImage && (
          <span className="self-start rounded-full bg-rouge px-3 py-1 text-sm font-bold text-white">{montant(evenement.prix, evenement.devise)}</span>
        )}
        <h2 className="text-lg font-semibold leading-snug text-balance group-hover:text-primaire">{evenement.titre}</h2>
        <div className="flex flex-col gap-1.5 text-sm text-attenue">
          <p className="flex items-center gap-2">
            <Icone nom="calendar_month" taille={18} className="text-primaire" />
            {dateLongue(evenement.dateDebut)}
          </p>
          {evenement.lieu && (
            <p className="flex items-center gap-2">
              <Icone nom="location_on" taille={18} className="text-primaire" />
              {evenement.lieu}
            </p>
          )}
        </div>
        <div className="mt-auto pt-2">
          <JaugePlaces evenement={evenement} />
        </div>
      </div>
    </Link>
  )
}
