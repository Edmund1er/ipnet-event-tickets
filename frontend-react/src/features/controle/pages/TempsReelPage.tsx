import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../core/auth/AuthContext'
import { messageErreur } from '../../../core/api/httpClient'
import { Bouton } from '../../../core/components/ui/Bouton'
import { ChargementPage } from '../../../core/components/ui/Chargement'
import { Alerte, EtatVide } from '../../../core/components/ui/Divers'
import { Icone } from '../../../core/components/ui/Icone'
import { useToast } from '../../../core/components/ui/Toasts'
import { heureSecondes, initiales, versDate } from '../../../core/utils/format'
import { SelecteurEvenement } from '../components/SelecteurEvenement'
import { useEvenementControle } from '../hooks/useEvenementControle'
import { controleService, type Statistiques } from '../services/controleService'
import { ouvrirFlux, type EtatFlux } from '../wrappers/fluxSseWrapper'

/**
 * EF-44 : tableau de bord temps réel (maquette Stitch), alimenté exclusivement par le flux SSE de l'API :
 * entrées, billets confirmés restants, liste des personnes entrées (nom, prénom, profil, heure).
 */
export function TempsReelPage() {
  const { role } = useAuth()
  const { evenements, chargement, erreur, evenement, choisir } = useEvenementControle()
  const [stats, setStats] = useState<Statistiques | null>(null)
  const [etat, setEtat] = useState<EtatFlux>('connexion')
  const [maj, setMaj] = useState<Date | null>(null)
  const [horloge, setHorloge] = useState(new Date())
  const [export_, setExport] = useState<'CSV' | 'PDF' | null>(null)
  const toast = useToast()

  useEffect(() => {
    const t = setInterval(() => setHorloge(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    setStats(null)
    if (!evenement) return
    return ouvrirFlux<Statistiques>(
      evenement.id,
      (s) => {
        setStats(s)
        setMaj(new Date())
      },
      setEtat,
    )
  }, [evenement])

  const affluence = useMemo(() => tranchesQuartHeure(stats?.personnes ?? []), [stats])

  async function exporter(format: 'CSV' | 'PDF') {
    if (!evenement) return
    setExport(format)
    try {
      await controleService.exporter(evenement.id, format)
    } catch (e) {
      toast.erreur(messageErreur(e))
    } finally {
      setExport(null)
    }
  }

  if (chargement) return <ChargementPage />

  const capacite = evenement?.capacite ?? 0
  const entres = stats?.nombreEntrees ?? 0
  const confirmes = stats?.nombreBilletsConfirmes ?? 0
  const restants = stats?.nombreRestants ?? 0
  const pctEntres = confirmes ? Math.round((entres / confirmes) * 100) : 0
  const pctCapEntres = capacite ? (entres / capacite) * 100 : 0
  const pctCapRestants = capacite ? (restants / capacite) * 100 : 0
  const quinzeMin = (stats?.personnes ?? []).filter((p) => (versDate(p.entreeLe)?.getTime() ?? 0) > Date.now() - 15 * 60_000).length

  return (
    <div className="flex flex-col gap-5">
      {/* Bandeau d'état */}
      <section className="carte flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${
              etat === 'connecte' ? 'bg-primaire-clair text-primaire' : 'bg-alerte-clair text-alerte'
            }`}
            role="status"
          >
            <span className={`h-2.5 w-2.5 rounded-full ${etat === 'connecte' ? 'animate-pulse bg-primaire' : 'bg-alerte'}`} />
            {etat === 'connecte' ? 'EN DIRECT' : etat === 'connexion' ? 'CONNEXION…' : 'RECONNEXION…'}
          </span>
          <div className="text-sm">
            <p className="text-attenue">Horloge</p>
            <p className="chiffres font-semibold text-primaire">{horloge.toLocaleTimeString('fr-FR')}</p>
          </div>
          {maj && (
            <div className="text-sm">
              <p className="text-attenue">Dernière mise à jour</p>
              <p className="chiffres font-semibold">{maj.toLocaleTimeString('fr-FR')}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="sm:w-80">
            <SelecteurEvenement evenements={evenements} evenement={evenement} surChoix={choisir} />
          </div>
          {role === 'ADMIN' && evenement && (
            <div className="flex gap-2">
              <Bouton variante="secondaire" icone="download" enCours={export_ === 'CSV'} onClick={() => exporter('CSV')}>
                CSV
              </Bouton>
              <Bouton variante="secondaire" icone="picture_as_pdf" enCours={export_ === 'PDF'} onClick={() => exporter('PDF')}>
                PDF
              </Bouton>
            </div>
          )}
        </div>
      </section>

      {erreur && <Alerte ton="erreur">{erreur}</Alerte>}
      {!evenement ? (
        <EtatVide icone="monitoring" titre="Choisissez un événement" texte="Le tableau se met à jour en direct à chaque entrée validée." />
      ) : (
        <>
          {/* Compteurs */}
          <div className="grid gap-5 md:grid-cols-2">
            <section className="carte relative overflow-hidden p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primaire-clair text-primaire">
                  <Icone nom="how_to_reg" />
                </span>
                <h2 className="text-base font-semibold uppercase tracking-wide">Participants admis</h2>
              </div>
              <p className="mt-5 flex items-baseline gap-3">
                <span className="chiffres font-titre text-6xl font-extrabold text-encre">{entres}</span>
                <span className="text-2xl text-attenue">/ {capacite} places</span>
              </p>
              <div className="mt-5 rounded-lg bg-surface p-4">
                <div className="mb-2 flex justify-between text-sm">
                  <span>
                    <strong>+{quinzeMin}</strong> entrée{quinzeMin > 1 ? 's' : ''} dans les 15 dernières minutes
                  </span>
                  <span className="chiffres font-titre text-lg font-bold text-primaire">{pctEntres}%</span>
                </div>
                <div className="h-2.5 rounded bg-primaire-clair">
                  <div className="h-full rounded bg-primaire transition-all" style={{ width: `${Math.min(100, pctEntres)}%` }} />
                </div>
                <p className="mt-2 text-xs text-attenue">Part des billets confirmés déjà présentés</p>
              </div>
            </section>

            <section className="carte relative overflow-hidden p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-rouge-clair text-rouge">
                  <Icone nom="confirmation_number" />
                </span>
                <h2 className="text-base font-semibold uppercase tracking-wide">Attente &amp; disponibilité</h2>
              </div>
              <p className="mt-5 flex items-baseline gap-3">
                <span className="chiffres font-titre text-6xl font-extrabold text-rouge">{restants}</span>
                <span className="text-2xl text-attenue">billets confirmés restants</span>
              </p>
              <div className="mt-5 rounded-lg bg-surface p-4">
                <div className="mb-2 flex justify-between text-sm">
                  <span>Billets confirmés</span>
                  <span className="chiffres font-titre text-lg font-bold">{confirmes}</span>
                </div>
                <div className="h-2.5 rounded bg-rouge-clair">
                  <div className="h-full rounded bg-rouge transition-all" style={{ width: `${confirmes ? (restants / confirmes) * 100 : 0}%` }} />
                </div>
                <p className="mt-2 text-xs text-attenue">Billets payés pas encore présentés à l'entrée</p>
              </div>
            </section>
          </div>

          {/* Jauge globale */}
          <section className="carte p-6">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primaire-clair text-primaire">
                  <Icone nom="speed" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold">Jauge d'affluence &amp; remplissage</h2>
                  <p className="text-sm text-attenue">Entrées et billets restants rapportés à la capacité de l'événement</p>
                </div>
              </div>
              <ul className="flex flex-wrap gap-4 text-sm">
                <li className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-primaire" /> Entrés ({entres})
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rouge" /> Billets restants ({restants})
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-primaire-clair ring-1 ring-primaire-moyen" /> Capacité ({capacite})
                </li>
              </ul>
            </div>
            <div className="flex h-9 overflow-hidden rounded-lg bg-primaire-clair" role="img" aria-label={`${entres} entrés, ${restants} billets restants, capacité ${capacite}`}>
              <div className="chiffres flex items-center justify-end bg-primaire px-2 text-sm font-bold text-white transition-all" style={{ width: `${pctCapEntres}%` }}>
                {pctCapEntres >= 8 && `${Math.round(pctCapEntres)}%`}
              </div>
              <div className="chiffres flex items-center justify-end bg-rouge px-2 text-sm font-bold text-white transition-all" style={{ width: `${pctCapRestants}%` }}>
                {pctCapRestants >= 8 && `${Math.round(pctCapRestants)}%`}
              </div>
            </div>
            <div className="chiffres mt-2 flex justify-between text-xs text-attenue">
              <span>0</span>
              <span>{Math.round(capacite / 2)} (50%)</span>
              <span>{capacite} (capacité)</span>
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            {/* Flux des entrées */}
            <section className="carte p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primaire-clair text-primaire">
                    <Icone nom="dynamic_feed" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold">Flux des entrées en temps réel</h2>
                    <p className="text-sm text-attenue">Billets acceptés au contrôle, du plus récent au plus ancien</p>
                  </div>
                </div>
              </div>
              {!stats ? (
                <ChargementPage texte="Connexion au flux…" />
              ) : stats.personnes.length === 0 ? (
                <p className="py-10 text-center text-sm text-attenue">Aucune entrée pour le moment.</p>
              ) : (
                <div className="max-h-[560px] overflow-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-bordure text-left">
                        <th scope="col" className="titre-section px-3 py-3">
                          Participant
                        </th>
                        <th scope="col" className="titre-section px-3 py-3">
                          Profil
                        </th>
                        <th scope="col" className="titre-section px-3 py-3">
                          Heure exacte
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.personnes.map((p, i) => (
                        <tr key={`${p.entreeLe}-${i}`} className={`border-b border-bordure last:border-0 ${i === 0 ? 'bg-primaire-clair' : ''}`}>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-primaire text-white' : 'bg-primaire-clair text-primaire'}`}>
                                {initiales(p.nom, p.prenom)}
                              </span>
                              <div>
                                <p className="font-semibold uppercase">
                                  {p.nom} <span className="normal-case">{p.prenom}</span>
                                </p>
                                {i === 0 && <p className="text-xs font-semibold text-primaire">Dernier passage</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">{p.detail}</td>
                          <td className="px-3 py-3">
                            <span className={`chiffres rounded px-2 py-1 ${i === 0 ? 'bg-white font-semibold text-primaire' : ''}`}>{heureSecondes(p.entreeLe)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {stats && <p className="mt-3 text-xs text-attenue">Total des entrées enregistrées : {stats.nombreEntrees}</p>}
            </section>

            {/* Affluence par quart d'heure */}
            <section className="carte p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primaire-clair text-primaire">
                  <Icone nom="bar_chart" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold">Affluence / 15 min</h2>
                  <p className="text-sm text-attenue">Entrées validées par quart d'heure</p>
                </div>
              </div>
              {affluence.length === 0 ? (
                <p className="py-10 text-center text-sm text-attenue">Le graphique apparaîtra dès la première entrée.</p>
              ) : (
                <Histogramme tranches={affluence} />
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}

interface Tranche {
  libelle: string
  valeur: number
}

function tranchesQuartHeure(personnes: { entreeLe: string }[]): Tranche[] {
  const compte = new Map<number, number>()
  for (const p of personnes) {
    const d = versDate(p.entreeLe)
    if (!d) continue
    const cle = Math.floor(d.getTime() / 900_000)
    compte.set(cle, (compte.get(cle) ?? 0) + 1)
  }
  if (compte.size === 0) return []
  const cles = [...compte.keys()].sort((a, b) => a - b)
  const fin = cles[cles.length - 1]
  const debut = Math.max(cles[0], fin - 7)
  const res: Tranche[] = []
  for (let c = debut; c <= fin; c++) {
    const d = new Date(c * 900_000)
    res.push({ libelle: `${d.getHours()}h${d.getMinutes().toString().padStart(2, '0')}`, valeur: compte.get(c) ?? 0 })
  }
  return res
}

function Histogramme({ tranches }: { tranches: Tranche[] }) {
  const max = Math.max(...tranches.map((t) => t.valeur), 1)
  const pic = tranches.reduce((a, b) => (b.valeur > a.valeur ? b : a))
  return (
    <figure>
      <div className="flex h-48 items-end gap-2 border-b border-dashed border-bordure" role="img" aria-label={`Pic de ${pic.valeur} entrées à ${pic.libelle}`}>
        {tranches.map((t, i) => (
          <div key={t.libelle + i} className="flex flex-1 flex-col items-center justify-end gap-1">
            <span className="chiffres text-[11px] font-semibold text-attenue">{t.valeur || ''}</span>
            <div
              className={`w-full rounded-t ${i === tranches.length - 1 ? 'bg-primaire-fonce' : t === pic ? 'bg-primaire' : 'bg-primaire-moyen'}`}
              style={{ height: `${(t.valeur / max) * 100}%`, minHeight: t.valeur ? 4 : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        {tranches.map((t, i) => (
          <span key={t.libelle + i} className={`chiffres flex-1 text-center text-[11px] ${i === tranches.length - 1 ? 'font-semibold text-primaire' : 'text-attenue'}`}>
            {i === tranches.length - 1 ? 'En cours' : t.libelle}
          </span>
        ))}
      </div>
      <figcaption className="mt-3 text-sm">
        Pic : <strong className="chiffres">{pic.valeur}</strong> entrée{pic.valeur > 1 ? 's' : ''} ({pic.libelle})
      </figcaption>
    </figure>
  )
}
