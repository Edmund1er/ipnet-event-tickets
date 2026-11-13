import type { ReactNode } from 'react'
import type { Evenement } from '../../../core/api/types'
import { Badge } from '../../../core/components/ui/Badge'
import { Icone } from '../../../core/components/ui/Icone'
import { STATUTS_EVENEMENT } from '../../../core/constants/statuts'
import { dateLongue, heure, montant } from '../../../core/utils/format'
import { urlImageEvenement } from '../services/evenementService'
import type { CleModele } from '../theme/palettes'
import { JaugePlaces } from './CarteEvenement'

/**
 * Modèles de page d'un événement. Tous tiennent dans UN SEUL conteneur (un seul bloc blanc), sans cartes imbriquées :
 * les informations sont séparées par des filets, pas par des boîtes. Le contenu de la page (réservation, programme)
 * est passé en paramètre : un modèle ne décide que de la mise en page.
 */

const FOND_GENERE = 'var(--ev-motif), linear-gradient(135deg, var(--ev-primaire), var(--ev-fonce))'

export function libelleTarif(e: Evenement): string {
  if (e.accesLibre) return 'Accès libre'
  if (e.prix === 0) return 'Gratuit'
  return montant(e.prix, e.devise)
}

/** Visuel de l'événement : sa photo, sinon un fond généré dans sa couleur. */
function Visuel({ evt, className = '', children }: { evt: Evenement; className?: string; children?: ReactNode }) {
  return (
    <div
      className={`relative isolate overflow-hidden ${className}`}
      style={evt.aImage ? undefined : { backgroundImage: FOND_GENERE, color: 'var(--ev-sur-primaire)' }}
    >
      {evt.aImage ? (
        <img src={urlImageEvenement(evt.id)} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
      ) : (
        <Icone nom="event" taille={140} className="absolute -bottom-6 -right-4 -z-10 opacity-15" />
      )}
      {children}
    </div>
  )
}

function Etiquettes({ evt, passe }: { evt: Evenement; passe: boolean }) {
  const statut = STATUTS_EVENEMENT[evt.statut]
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge ton={statut.ton}>{statut.libelle}</Badge>
      {passe && evt.statut === 'PUBLIE' && <Badge ton="gris">Date passée</Badge>}
      {evt.type === 'PASS' && <Badge ton="violet">Pass</Badge>}
      {evt.type === 'CADRE' && <Badge ton="violet">Programme</Badge>}
    </div>
  )
}

/** Informations pratiques en lignes séparées par des filets (jamais en cartes). */
export function Infos({ evt }: { evt: Evenement }) {
  const lignes: { icone: string; titre: string; texte: ReactNode }[] = [
    {
      icone: 'calendar_month',
      titre: evt.type === 'CADRE' ? 'Dates' : 'Date',
      texte:
        evt.type === 'CADRE' ? (
          <>
            {dateLongue(evt.dateDebut)} <span className="text-attenue">→</span> {dateLongue(evt.dateFin)}
          </>
        ) : (
          <>
            {dateLongue(evt.dateDebut)}
            {evt.dateFin && evt.type !== 'PASS' && <> — {heure(evt.dateFin)}</>}
            {evt.type === 'PASS' && evt.passPortee === 'GLOBAL' && ' · valable pendant tout le programme'}
          </>
        ),
    },
  ]
  if (evt.lieu) lignes.push({ icone: 'location_on', titre: 'Lieu', texte: evt.lieu })
  return (
    <dl className="divide-y divide-black/10 border-y border-black/10">
      {lignes.map((l) => (
        <div key={l.titre} className="flex items-start gap-3 py-3.5">
          <Icone nom={l.icone} className="mt-0.5 shrink-0 text-rouge" />
          <div className="min-w-0">
            <dt className="text-xs font-semibold uppercase tracking-wide text-attenue">{l.titre}</dt>
            <dd className="font-medium text-encre">{l.texte}</dd>
          </div>
        </div>
      ))}
    </dl>
  )
}

/** Tarif, jauge de places et réservation : même contenu dans tous les modèles. */
function PanneauReservation({ evt, reservation }: { evt: Evenement; reservation: ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="titre-section">{evt.type === 'PASS' ? 'Pass' : 'Tarif'}</p>
        <p className="mt-1 font-titre text-4xl font-extrabold leading-none text-rouge">{libelleTarif(evt)}</p>
      </div>
      {!evt.accesLibre && <JaugePlaces evenement={evt} />}
      {reservation}
    </div>
  )
}

function Description({ evt }: { evt: Evenement }) {
  if (!evt.description?.trim()) return null
  return <p className="whitespace-pre-line text-[17px] leading-8 text-encre/85">{evt.description}</p>
}

interface Props {
  evt: Evenement
  modele: CleModele
  passe: boolean
  /** Bloc de réservation (déjà prêt à afficher). */
  reservation: ReactNode
  /** Contenu supplémentaire sous l'en-tête : le programme d'un événement-cadre. */
  corps?: ReactNode
}

const CONTENEUR = 'overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5'

function Classique({ evt, passe, reservation, corps }: Omit<Props, 'modele'>) {
  return (
    <article className={CONTENEUR}>
      <Visuel evt={evt} className="flex min-h-[240px] items-end sm:min-h-[340px]">
        {evt.aImage && <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />}
        <div className="w-full p-6 text-white sm:p-10" style={evt.aImage ? undefined : { color: 'var(--ev-sur-primaire)' }}>
          <Etiquettes evt={evt} passe={passe} />
          <h1 className="mt-3 max-w-3xl text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{evt.titre}</h1>
        </div>
      </Visuel>
      <div className={corps ? '' : 'grid lg:grid-cols-[1fr_380px]'}>
        {corps ? (
          <div className="p-6 sm:p-10">
            <div className="mb-8 grid gap-8 lg:grid-cols-[1fr_320px]">
              <Description evt={evt} />
              <Infos evt={evt} />
            </div>
            {corps}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-8 p-6 sm:p-10">
              <Infos evt={evt} />
              <Description evt={evt} />
            </div>
            <div className="border-t border-black/10 bg-neutral-50 p-6 sm:p-8 lg:border-l lg:border-t-0">
              <div className="lg:sticky lg:top-24">
                <PanneauReservation evt={evt} reservation={reservation} />
              </div>
            </div>
          </>
        )}
      </div>
    </article>
  )
}

function Affiche({ evt, passe, reservation }: Omit<Props, 'modele'>) {
  return (
    <article className={`${CONTENEUR} grid lg:min-h-[560px] lg:grid-cols-2`}>
      <Visuel evt={evt} className="flex min-h-[260px] items-end lg:min-h-full">
        {evt.aImage && <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 to-transparent" />}
        <div className="p-6 sm:p-10" style={{ color: evt.aImage ? '#fff' : 'var(--ev-sur-primaire)' }}>
          <Etiquettes evt={evt} passe={passe} />
          <h1 className="mt-3 text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">{evt.titre}</h1>
        </div>
      </Visuel>
      <div className="flex flex-col justify-center gap-7 p-6 sm:p-10">
        <Description evt={evt} />
        <Infos evt={evt} />
        <PanneauReservation evt={evt} reservation={reservation} />
      </div>
    </article>
  )
}

function Magazine({ evt, passe, reservation, corps }: Omit<Props, 'modele'>) {
  return (
    <article className={CONTENEUR}>
      <header className="px-6 pb-8 pt-10 text-center sm:px-10 sm:pt-14">
        <div className="flex justify-center">
          <Etiquettes evt={evt} passe={passe} />
        </div>
        <h1 className="mx-auto mt-4 max-w-3xl text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{evt.titre}</h1>
        <div className="mx-auto mt-6 h-1 w-20 rounded-full bg-rouge" />
      </header>
      <Visuel evt={evt} className="aspect-[21/9] min-h-[180px] w-full" />
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10 sm:px-10">
        <Infos evt={evt} />
        <Description evt={evt} />
        {corps}
      </div>
      {!corps && (
        <div className="border-t border-black/10 bg-neutral-50 px-6 py-8 sm:px-10">
          <div className="mx-auto max-w-xl">
            <PanneauReservation evt={evt} reservation={reservation} />
          </div>
        </div>
      )}
    </article>
  )
}

function Epure({ evt, passe, reservation }: Omit<Props, 'modele'>) {
  return (
    <article className={`${CONTENEUR} mx-auto max-w-2xl`}>
      <div className="h-2" style={{ backgroundImage: 'linear-gradient(90deg, var(--ev-primaire), var(--ev-fonce))' }} />
      <div className="flex flex-col gap-7 p-6 sm:p-10">
        <div>
          <Etiquettes evt={evt} passe={passe} />
          <h1 className="mt-3 text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{evt.titre}</h1>
        </div>
        <Infos evt={evt} />
        <Description evt={evt} />
        <PanneauReservation evt={evt} reservation={reservation} />
      </div>
    </article>
  )
}

/** Modèle choisi par l'admin ; à défaut : Classique avec une image, Épuré avec peu de contenu. */
export function modeleEffectif(evt: Evenement): CleModele {
  if (evt.modele) return evt.modele
  if (evt.type === 'CADRE') return 'CLASSIQUE'
  return evt.aImage || evt.description?.trim() ? 'CLASSIQUE' : 'EPURE'
}

export function ModelePage({ modele, ...p }: Props) {
  // Un programme (corps) ne s'affiche que dans les modèles à colonne large ; les autres retombent sur Classique
  const m = p.corps && (modele === 'AFFICHE' || modele === 'EPURE') ? 'CLASSIQUE' : modele
  const { evt, passe, reservation, corps } = p
  if (m === 'AFFICHE') return <Affiche evt={evt} passe={passe} reservation={reservation} />
  if (m === 'MAGAZINE') return <Magazine evt={evt} passe={passe} reservation={reservation} corps={corps} />
  if (m === 'EPURE') return <Epure evt={evt} passe={passe} reservation={reservation} />
  return <Classique evt={evt} passe={passe} reservation={reservation} corps={corps} />
}
