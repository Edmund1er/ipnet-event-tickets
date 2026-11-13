import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Evenement } from '../../../core/api/types'
import { classeBouton } from '../../../core/components/ui/Bouton'
import { Icone } from '../../../core/components/ui/Icone'
import { heure, montant } from '../../../core/utils/format'
import { themeEvenement } from '../theme/ambiances'
import { categorieDe } from '../theme/categories'

/** "2026-06-03T07:00:00" → "2026-06-03" */
const cleJour = (iso: string) => iso.slice(0, 10)
const jourDe = (cle: string) => new Date(`${cle}T12:00:00`)

/** Tous les jours du programme, du premier au dernier. */
function joursEntre(debut: string, fin: string): string[] {
  const jours: string[] = []
  const d = jourDe(cleJour(debut))
  const dernier = cleJour(fin)
  for (let i = 0; i < 90; i++) {
    const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    jours.push(cle)
    if (cle >= dernier) break
    d.setDate(d.getDate() + 1)
  }
  return jours
}

export function libelleTarif(e: Evenement): string {
  if (e.accesLibre) return 'Accès libre'
  if (e.prix === 0) return 'Gratuit · inscription'
  return montant(e.prix, e.devise)
}

/** Une activité : une ligne du programme (heure, titre, lieu, tarif), pas une carte. */
function LigneActivite({ a }: { a: Evenement }) {
  const cat = categorieDe(a.categorie)
  const couleur = a.couleurPrincipale ?? cat.couleur
  const complet = !a.accesLibre && a.placesRestantes === 0
  return (
    <li style={themeEvenement(a.ambiance, couleur)}>
      <Link
        to={`/evenements/${a.id}`}
        className="group -mx-3 flex items-center gap-3 rounded-xl px-3 py-4 transition-colors hover:bg-neutral-100 focus-visible:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-indigo-500 sm:gap-5"
      >
        <div className="w-[4.5rem] shrink-0 text-right sm:w-20">
          <p className="chiffres text-base font-extrabold leading-tight text-encre">{heure(a.dateDebut)}</p>
          {a.dateFin && <p className="chiffres text-xs text-attenue">{heure(a.dateFin)}</p>}
        </div>
        <span className="w-1 self-stretch rounded-full" style={{ background: couleur }} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: couleur }}>
            <Icone nom={cat.icone} taille={16} /> {cat.libelle}
            {a.statut === 'ANNULE' && <span className="ml-1 rounded bg-erreur-clair px-1.5 py-0.5 normal-case text-erreur">Annulé</span>}
            {complet && a.statut !== 'ANNULE' && <span className="ml-1 rounded bg-erreur-clair px-1.5 py-0.5 normal-case text-erreur">Complet</span>}
          </p>
          <p className="mt-0.5 text-balance font-bold leading-snug text-encre group-hover:text-rouge">{a.titre}</p>
          {a.lieu && (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-attenue">
              <Icone nom="location_on" taille={16} /> {a.lieu}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="text-sm font-bold text-encre">{libelleTarif(a)}</span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-rouge">
            {a.accesLibre ? 'Détails' : 'Réserver'} <Icone nom="arrow_forward" taille={16} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </li>
  )
}

/**
 * Programme d'un événement-cadre, dans le conteneur de la page : liste des pass, puis jours à gauche
 * (défilement horizontal sur mobile) et activités du jour à droite. Les contenus défilent au lieu d'être compressés.
 */
export function ProgrammeEvenement({ cadre, elements }: { cadre: Evenement; elements: Evenement[] }) {
  const pass = elements.filter((e) => e.type === 'PASS')
  const activites = useMemo(() => elements.filter((e) => e.type === 'ACTIVITE'), [elements])
  const jours = useMemo(() => joursEntre(cadre.dateDebut, cadre.dateFin ?? cadre.dateDebut), [cadre])
  const parJour = useMemo(() => {
    const m = new Map<string, Evenement[]>()
    for (const a of activites) m.set(cleJour(a.dateDebut), [...(m.get(cleJour(a.dateDebut)) ?? []), a])
    return m
  }, [activites])

  const aujourdhui = new Date().toISOString().slice(0, 10)
  const initial = parJour.has(aujourdhui) ? aujourdhui : (jours.find((j) => parJour.has(j)) ?? jours[0])
  const [jour, setJour] = useState(initial)
  const [categorie, setCategorie] = useState<string | null>(null)
  const [toutVoir, setToutVoir] = useState(false)

  const categories = useMemo(() => [...new Set(activites.map((a) => a.categorie ?? 'AUTRE'))], [activites])
  const visibles = (j: string) =>
    (parJour.get(j) ?? []).filter((a) => !categorie || (a.categorie ?? 'AUTRE') === categorie).sort((x, y) => x.dateDebut.localeCompare(y.dateDebut))
  const joursAffiches = toutVoir ? jours.filter((j) => visibles(j).length > 0) : [jour]

  return (
    <div className="flex flex-col gap-12" aria-label="Programme">
      {pass.length > 0 && (
        <section>
          <h2 className="mb-1 text-xl font-extrabold tracking-tight text-encre">Pass</h2>
          <p className="mb-3 text-sm text-attenue">Un pass donne accès aux activités du programme, sans billet par activité.</p>
          <ul className="divide-y divide-black/10 border-y border-black/10">
            {pass.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-5 gap-y-3 py-4" style={themeEvenement(p.ambiance, p.couleurPrincipale ?? cadre.couleurPrincipale)}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rouge text-[color:var(--ev-sur-primaire,#fff)]">
                  <Icone nom="confirmation_number" taille={22} />
                </span>
                <div className="min-w-0 flex-1 basis-48">
                  <p className="font-bold text-encre">{p.titre}</p>
                  <p className="text-sm text-attenue">
                    {p.passPortee === 'JOURNEE' && p.passJour
                      ? `Valable le ${jourDe(p.passJour).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`
                      : 'Valable pendant tout le programme'}
                    {p.placesRestantes === 0 && <span className="ml-2 font-semibold text-erreur">Complet</span>}
                  </p>
                </div>
                <span className="font-titre text-2xl font-extrabold text-rouge">{montant(p.prix, p.devise)}</span>
                <Link to={`/evenements/${p.id}`} className={classeBouton('rouge')}>
                  Choisir ce pass
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activites.length === 0 ? (
        <p className="border-y border-black/10 py-8 text-center text-attenue">Le programme détaillé sera bientôt disponible.</p>
      ) : (
        <section>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold tracking-tight text-encre">Programme</h2>
            <button type="button" onClick={() => setToutVoir((v) => !v)} className={classeBouton('fantome', 'petit')}>
              <Icone nom={toutVoir ? 'calendar_view_day' : 'list'} taille={18} /> {toutVoir ? 'Voir par jour' : 'Tout le programme'}
            </button>
          </div>

          {categories.length > 1 && (
            <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Filtrer par catégorie">
              <button type="button" onClick={() => setCategorie(null)} aria-pressed={!categorie} className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${!categorie ? 'border-neutral-800 bg-neutral-800 text-white' : 'border-black/15 bg-white hover:bg-neutral-100'}`}>
                Tout
              </button>
              {categories.map((c) => {
                const info = categorieDe(c)
                const actif = categorie === c
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategorie(actif ? null : c)}
                    aria-pressed={actif}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors hover:brightness-95"
                    style={actif ? { background: info.couleur, borderColor: info.couleur, color: '#fff' } : { borderColor: 'rgba(0,0,0,.15)', background: '#fff' }}
                  >
                    <Icone nom={info.icone} taille={16} /> {info.libelle}
                  </button>
                )
              })}
            </div>
          )}

          <div className={toutVoir ? '' : 'grid gap-8 lg:grid-cols-[240px_1fr]'}>
            {!toutVoir && (
              <nav className="-mx-6 overflow-x-auto px-6 pb-2 sm:-mx-10 sm:px-10 lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0" aria-label="Jours du programme">
                <div className="flex gap-2 lg:flex-col lg:gap-1" role="tablist">
                  {jours.map((j) => {
                    const d = jourDe(j)
                    const actif = j === jour
                    const nb = (parJour.get(j) ?? []).length
                    return (
                      <button
                        key={j}
                        type="button"
                        role="tab"
                        aria-selected={actif}
                        onClick={() => setJour(j)}
                        className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left transition duration-150 lg:w-full ${actif ? 'bg-neutral-800 text-white shadow-md' : 'bg-neutral-100 text-encre hover:bg-neutral-200'} ${nb === 0 ? 'opacity-55' : ''}`}
                      >
                        <span className="w-9 text-center leading-none">
                          <span className="chiffres block text-2xl font-extrabold">{d.getDate()}</span>
                          <span className="block text-[11px] font-bold uppercase">{d.toLocaleDateString('fr-FR', { month: 'short' })}</span>
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold capitalize">{d.toLocaleDateString('fr-FR', { weekday: 'long' })}</span>
                          <span className={`block text-xs ${actif ? 'text-white/70' : 'text-attenue'}`}>{nb} activité{nb > 1 ? 's' : ''}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </nav>
            )}

            <div role="tabpanel">
              {joursAffiches.map((j) => {
                const liste = visibles(j)
                return (
                  <div key={j} className="mb-8 last:mb-0">
                    <h3 className="mb-1 text-lg font-bold capitalize text-encre">{jourDe(j).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                    {liste.length === 0 ? (
                      <p className="border-y border-black/10 py-8 text-center text-attenue">Aucune activité ce jour-là{categorie ? ' dans cette catégorie' : ''}.</p>
                    ) : (
                      <ul className="divide-y divide-black/10 border-y border-black/10">
                        {liste.map((a) => (
                          <LigneActivite key={a.id} a={a} />
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
