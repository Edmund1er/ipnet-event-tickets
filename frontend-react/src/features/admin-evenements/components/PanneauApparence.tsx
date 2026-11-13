import { Icone } from '../../../core/components/ui/Icone'
import { AMBIANCES, CLES_AMBIANCE, ambianceDe, texteSur, themeEvenement, type CleAmbiance } from '../../evenements/theme/ambiances'
import { MODELES, PALETTES, type CleModele } from '../../evenements/theme/palettes'
import { classeBouton } from '../../../core/components/ui/Bouton'

export interface Apparence {
  modele: CleModele
  couleur: string | null
  ambiance: CleAmbiance
}

interface Props {
  valeur: Apparence
  surChangement: (a: Apparence) => void
  desactive?: boolean
}

/** Mini schéma de chaque modèle : l'admin reconnaît la mise en page sans lire de description. */
function Schema({ modele }: { modele: CleModele }) {
  const bloc = 'rounded-sm bg-neutral-300'
  const accent = 'rounded-sm bg-indigo-400'
  return (
    <div className="flex h-20 w-full flex-col overflow-hidden rounded-md border border-neutral-300 bg-white p-1.5" aria-hidden>
      {modele === 'CLASSIQUE' && (
        <>
          <div className={`${accent} h-8`} />
          <div className="mt-1 flex flex-1 gap-1">
            <div className={`${bloc} flex-[2]`} />
            <div className="flex-1 rounded-sm bg-neutral-200" />
          </div>
        </>
      )}
      {modele === 'AFFICHE' && (
        <div className="flex flex-1 gap-1">
          <div className={`${accent} flex-1`} />
          <div className="flex flex-1 flex-col gap-1">
            <div className={`${bloc} flex-1`} />
            <div className="h-3 rounded-sm bg-neutral-700" />
          </div>
        </div>
      )}
      {modele === 'MAGAZINE' && (
        <>
          <div className="mx-auto mb-1 h-2 w-2/3 rounded-sm bg-neutral-700" />
          <div className={`${accent} h-6`} />
          <div className={`${bloc} mx-auto mt-1 w-2/3 flex-1`} />
        </>
      )}
      {modele === 'EPURE' && (
        <>
          <div className="mx-auto mb-1 h-1 w-full rounded-sm bg-indigo-400" />
          <div className="mx-auto h-2 w-3/4 rounded-sm bg-neutral-700" />
          <div className={`${bloc} mx-auto mt-1.5 w-3/4 flex-1`} />
        </>
      )}
    </div>
  )
}

function Etape({ numero, titre, aide, children }: { numero: number; titre: string; aide: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-sm font-bold text-white">{numero}</span>
        <div>
          <h3 className="font-bold leading-tight text-encre">{titre}</h3>
          <p className="text-xs text-attenue">{aide}</p>
        </div>
      </header>
      {children}
    </section>
  )
}

/**
 * Apparence de la page d'un événement, en trois étapes : modèle de mise en page, couleur, fond sans photo,
 * avec un aperçu qui se met à jour en direct. Aucun terme technique.
 */
export function PanneauApparence({ valeur, surChangement, desactive }: Props) {
  const couleurEffective = valeur.couleur ?? ambianceDe(valeur.ambiance).couleur
  const personnalisee = !!valeur.couleur && !PALETTES.some((p) => p.couleur === valeur.couleur)
  const maj = (partiel: Partial<Apparence>) => surChangement({ ...valeur, ...partiel })

  return (
    <fieldset disabled={desactive} className="carte p-5 sm:p-6">
      <legend className="sr-only">Apparence de la page</legend>
      <div className="mb-6 flex items-center gap-3">
        <Icone nom="palette" className="text-indigo-600" />
        <h2 className="text-lg font-bold">Apparence de la page</h2>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Etape numero={1} titre="Modèle de page" aide="La mise en page que verront les étudiants.">
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Modèle de page">
            {MODELES.map((m) => {
              const actif = valeur.modele === m.cle
              return (
                <button
                  key={m.cle}
                  type="button"
                  role="radio"
                  aria-checked={actif}
                  title={m.description}
                  onClick={() => maj({ modele: m.cle })}
                  className={`flex flex-col gap-2 rounded-xl border-2 p-2 text-left transition ${actif ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-neutral-200 bg-white hover:border-neutral-400'}`}
                >
                  <Schema modele={m.cle} />
                  <span className="px-1 pb-0.5 text-sm font-bold">{m.nom}</span>
                </button>
              )
            })}
          </div>
          <p className="text-xs text-attenue">{MODELES.find((m) => m.cle === valeur.modele)?.description}</p>
        </Etape>

        <Etape numero={2} titre="Couleur" aide="Elle colore les boutons, le prix et les titres. Le texte reste lisible.">
          <div className="grid grid-cols-6 gap-2" role="radiogroup" aria-label="Couleur principale">
            {PALETTES.map((p) => {
              const actif = valeur.couleur === p.couleur
              return (
                <button
                  key={p.cle}
                  type="button"
                  role="radio"
                  aria-checked={actif}
                  title={p.nom}
                  onClick={() => maj({ couleur: p.couleur })}
                  className={`relative flex h-10 items-center justify-center rounded-full transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${actif ? 'ring-2 ring-offset-2 ring-neutral-800' : ''}`}
                  style={{ background: p.couleur, color: texteSur(p.couleur) }}
                >
                  {actif && <Icone nom="check" taille={20} />}
                  <span className="sr-only">{p.nom}</span>
                </button>
              )
            })}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 font-semibold ${personnalisee ? 'border-neutral-800 bg-neutral-100' : 'border-neutral-300 bg-white'}`}>
              <input type="color" value={couleurEffective} onChange={(e) => maj({ couleur: e.target.value })} className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0" />
              Couleur personnalisée
            </label>
            {valeur.couleur && (
              <button type="button" className="font-semibold text-indigo-700 underline" onClick={() => maj({ couleur: null })}>
                Couleur du fond choisi
              </button>
            )}
          </div>
        </Etape>

        <Etape numero={3} titre="Fond sans photo" aide="Motif utilisé quand aucune image n'est envoyée.">
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Fond sans photo">
            {CLES_AMBIANCE.map((cle) => {
              const actif = valeur.ambiance === cle
              return (
                <button
                  key={cle}
                  type="button"
                  role="radio"
                  aria-checked={actif}
                  onClick={() => maj({ ambiance: cle })}
                  className={`flex h-16 items-end rounded-lg border-2 p-1.5 text-left text-xs font-bold transition ${actif ? 'border-neutral-800 shadow-md' : 'border-transparent hover:border-neutral-400'}`}
                  style={{
                    ...themeEvenement(cle, valeur.couleur),
                    backgroundImage: 'var(--ev-motif), linear-gradient(135deg, var(--ev-primaire), var(--ev-fonce))',
                    color: 'var(--ev-sur-primaire)',
                  }}
                >
                  {AMBIANCES[cle].libelle}
                </button>
              )
            })}
          </div>
        </Etape>
      </div>

      {/* Aperçu : rendu miniature avec les réglages en cours */}
      <div className="mt-8 border-t border-neutral-200 pt-6" style={themeEvenement(valeur.ambiance, valeur.couleur)}>
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-attenue">Aperçu</p>
        <div className="overflow-hidden rounded-xl ring-1 ring-black/10">
          <div className="flex items-end p-6" style={{ backgroundImage: 'var(--ev-motif), linear-gradient(135deg, var(--ev-primaire), var(--ev-fonce))', color: 'var(--ev-sur-primaire)', minHeight: 110 }}>
            <p className="text-xl font-extrabold">Titre de votre événement</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4">
            <p className="font-titre text-2xl font-extrabold text-rouge">5 000 FCFA</p>
            <span className={classeBouton('rouge')}>Réserver ma place</span>
          </div>
        </div>
      </div>
    </fieldset>
  )
}
