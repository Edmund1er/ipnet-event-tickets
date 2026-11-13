import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Evenement } from '../../../core/api/types'
import { Icone } from '../../../core/components/ui/Icone'
import { heure, montant } from '../../../core/utils/format'
import { categorieDe } from '../theme/categories'
import { themeEvenement } from '../theme/ambiances'

/** "2026-06-03T07:00:00" → "2026-06-03" */
const cleJour = (iso: string) => iso.slice(0, 10)

function jourDe(cle: string) {
  return new Date(`${cle}T12:00:00`)
}

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

function CarteActivite({ a }: { a: Evenement }) {
  const cat = categorieDe(a.categorie)
  const complet = !a.accesLibre && a.placesRestantes === 0
  // Une activité peut avoir sa propre couleur ; sinon, celle de sa catégorie
  const couleur = a.couleurPrincipale ?? cat.couleur
  return (
    <Link
      to={`/evenements/${a.id}`}
      className="carte group flex gap-4 overflow-hidden p-0 transition-transform duration-200 hover:-translate-y-0.5"
      style={themeEvenement(a.ambiance, couleur)}
    >
      <div
        className="flex w-24 shrink-0 flex-col items-center justify-center gap-1 px-2 py-4 text-center sm:w-28"
        style={{
          backgroundImage: 'var(--ev-motif), linear-gradient(160deg, var(--ev-primaire), var(--ev-fonce))',
          color: 'var(--ev-sur-primaire)',
        }}
      >
        <Icone nom={cat.icone} taille={26} />
        <span className="chiffres text-base font-extrabold leading-tight">{heure(a.dateDebut)}</span>
        {a.dateFin && <span className="chiffres text-xs opacity-80">→ {heure(a.dateFin)}</span>}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 py-3 pr-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span style={{ color: couleur }}>{cat.libelle}</span>
          {a.statut === 'ANNULE' && <span className="rounded bg-erreur-clair px-1.5 py-0.5 text-erreur">Annulé</span>}
          {complet && a.statut !== 'ANNULE' && <span className="rounded bg-erreur-clair px-1.5 py-0.5 text-erreur">Complet</span>}
        </div>
        <h3 className="text-balance font-bold leading-snug text-encre group-hover:text-rouge">{a.titre}</h3>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-attenue">
          {a.lieu && (
            <span className="inline-flex items-center gap-1">
              <Icone nom="location_on" taille={16} /> {a.lieu}
            </span>
          )}
          <span className="inline-flex items-center gap-1 font-semibold text-encre">
            <Icone nom={a.accesLibre ? 'lock_open' : a.prix === 0 ? 'how_to_reg' : 'payments'} taille={16} /> {libelleTarif(a)}
          </span>
        </div>
      </div>
    </Link>
  )
}

/** Programme d'un événement-cadre : pass, bande de dates, filtres par catégorie, journée en détail. */
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

  return (
    <section className="flex flex-col gap-8" aria-label="Programme">
      {pass.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-extrabold uppercase tracking-wide text-encre">Pass</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {pass.map((p) => {
              const complet = p.placesRestantes === 0
              return (
                <Link key={p.id} to={`/evenements/${p.id}`} className="carte flex items-center gap-4 p-4 transition-transform hover:-translate-y-0.5" style={themeEvenement(p.ambiance, p.couleurPrincipale)}>
                  <div className="icone-carre shrink-0">
                    <Icone nom="confirmation_number" taille={26} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold leading-snug">{p.titre}</p>
                    <p className="text-sm text-attenue">
                      {p.passPortee === 'JOURNEE' && p.passJour ? `Valable le ${jourDe(p.passJour).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}` : 'Valable pendant tout le programme'}
                    </p>
                    {complet && <p className="text-xs font-semibold text-erreur">Complet</p>}
                  </div>
                  <span className="font-titre text-xl font-extrabold text-rouge">{montant(p.prix, p.devise)}</span>
                </Link>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-attenue">Un pass donne accès aux activités du programme, sans billet par activité.</p>
        </div>
      )}

      {activites.length === 0 ? (
        <p className="carte p-6 text-center text-attenue">Le programme détaillé sera bientôt disponible.</p>
      ) : (
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold uppercase tracking-wide text-encre">Programme</h2>
            <button type="button" onClick={() => setToutVoir((v) => !v)} className="text-sm font-semibold text-rouge underline">
              {toutVoir ? 'Voir par jour' : 'Tout le programme'}
            </button>
          </div>

          {categories.length > 1 && (
            <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrer par catégorie">
              <button type="button" onClick={() => setCategorie(null)} aria-pressed={!categorie} className={`rounded-full border px-3 py-1 text-sm font-semibold ${!categorie ? 'border-rouge bg-rouge text-white' : 'border-black/10'}`}>
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
                    className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-semibold"
                    style={actif ? { background: info.couleur, borderColor: info.couleur, color: '#fff' } : { borderColor: 'rgba(0,0,0,.1)' }}
                  >
                    <Icone nom={info.icone} taille={16} /> {info.libelle}
                  </button>
                )
              })}
            </div>
          )}

          {!toutVoir && (
            <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-2" role="tablist" aria-label="Jours du programme">
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
                    className={`relative flex w-16 shrink-0 flex-col items-center rounded-xl border px-2 py-2 ${actif ? 'border-rouge bg-rouge text-white' : 'border-black/10 bg-white'} ${nb === 0 ? 'opacity-50' : ''}`}
                  >
                    <span className="text-[11px] font-bold uppercase">{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                    <span className="chiffres text-xl font-extrabold leading-tight">{d.getDate()}</span>
                    <span className="text-[11px]">{d.toLocaleDateString('fr-FR', { month: 'short' })}</span>
                    {nb > 0 && <span className={`absolute right-1.5 top-1.5 h-2 w-2 rounded-full ${actif ? 'bg-white' : 'bg-rouge'}`} aria-label={`${nb} activités`} />}
                  </button>
                )
              })}
            </div>
          )}

          {(toutVoir ? jours : [jour]).map((j) => {
            const liste = visibles(j)
            if (toutVoir && liste.length === 0) return null
            return (
              <div key={j} className="mb-6">
                <h3 className="mb-3 font-bold capitalize text-encre">{jourDe(j).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                {liste.length === 0 ? (
                  <p className="carte p-5 text-center text-attenue">Aucune activité ce jour-là{categorie ? ' dans cette catégorie' : ''}.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {liste.map((a) => (
                      <CarteActivite key={a.id} a={a} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
