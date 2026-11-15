import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { messageErreur } from '../../../core/api/httpClient'
import type { Evenement } from '../../../core/api/types'
import { Bouton, classeBouton } from '../../../core/components/ui/Bouton'
import { ChargementPage } from '../../../core/components/ui/Chargement'
import { Alerte, EnteteSection } from '../../../core/components/ui/Divers'
import { Icone } from '../../../core/components/ui/Icone'
import { useToast } from '../../../core/components/ui/Toasts'
import { PageSite } from '../../evenements/site/PageSite'
import { MODELES, PAGE_VIDE, modeleDe, type CleModele, type PageConfig, type SectionConfig, type TypeSection } from '../../evenements/site/types'
import { evenementService } from '../../evenements/services/evenementService'
import { EditeurSection, TYPES_SECTION } from '../components/EditeurSection'
import { ChampCouleur } from '../components/ChampCouleur'
import { PALETTES_PAGE } from '../../evenements/theme/palettes'
import { adminEvenementService } from '../services/adminEvenementService'
import { EtapesEvenement } from '../components/EtapesEvenement'

const ORDRE: TypeSection[] = ['HERO', 'A_PROPOS', 'INTERVENANTS', 'PROGRAMME', 'LIEU', 'TEXTE', 'CARTES', 'COLONNES']

const APERCUS_MODELE: Record<CleModele, string> = {
  SOIREE: 'radial-gradient(ellipse at 82% 18%,#fb923c 0,transparent 34%),linear-gradient(125deg,#171717,#7c2d12)',
  CONFERENCE: 'radial-gradient(ellipse at 78% 20%,#facc15 0,transparent 34%),linear-gradient(125deg,#1c1917,#9a3412)',
  RENCONTRE: 'radial-gradient(ellipse at 78% 20%,#38bdf8 0,transparent 35%),linear-gradient(125deg,#0f172a,#0e7490)',
  CEREMONIE: 'radial-gradient(ellipse at 78% 20%,#fbbf24 0,transparent 35%),linear-gradient(125deg,#292524,#78350f)',
  ATELIER: 'radial-gradient(ellipse at 78% 20%,#a3e635 0,transparent 35%),linear-gradient(125deg,#1c1917,#365314)',
  TOURNOI: 'radial-gradient(ellipse at 78% 20%,#22d3ee 0,transparent 35%),linear-gradient(125deg,#0f172a,#155e75)',
  SALON: 'radial-gradient(ellipse at 78% 20%,#fcd34d 0,transparent 35%),linear-gradient(125deg,#1c1917,#713f12)',
  RESEAUTAGE: 'radial-gradient(ellipse at 78% 20%,#e879f9 0,transparent 35%),linear-gradient(125deg,#18181b,#581c87)',
}

function nouvelleSection(type: TypeSection): SectionConfig {
  return { id: `${type.toLowerCase()}-${Math.random().toString(36).slice(2, 8)}`, type, actif: true, intervenants: [], creneaux: [], elements: [], colonnes: 3 }
}

/**
 * Construction de la page d'un événement : choix du type de page (un template par type), puis sections facultatives.
 * Sans section, la page de base du type choisi se construit toute seule à partir de l'événement.
 */
export function ConstructeurPage() {
  const { id } = useParams()
  const toast = useToast()
  const evtId = Number(id)
  const [evt, setEvt] = useState<Evenement | null>(null)
  const [elements, setElements] = useState<Evenement[]>([])
  const [config, setConfig] = useState<PageConfig>(PAGE_VIDE)
  const [modele, setModele] = useState<CleModele | null>(null)
  const [ouverte, setOuverte] = useState<string | null>(null)
  const [apercus, setApercus] = useState<Record<string, string>>({})
  const nomsImages = useMemo(() => new Set(config.sections.flatMap((s) => [s.image, ...(s.intervenants ?? []).map((i) => i.photo), ...(s.elements ?? []).map((e) => e.image)].filter((n): n is string => !!n))), [config.sections])
  const apercusTemporaires = useRef(new Set<string>())
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [modifie, setModifie] = useState(false)

  const charger = useCallback(async () => {
    try {
      const e = await adminEvenementService.detail(evtId)
      const [page, liste] = await Promise.all([evenementService.page(evtId, true), e.type === 'CADRE' ? adminEvenementService.activites(evtId) : Promise.resolve([])])
      setEvt(e)
      setConfig(page)
      setElements(liste)
      setModele(modeleDe(e.modele)?.cle ?? null)
    } catch (err) {
      setErreur(messageErreur(err))
    } finally {
      setChargement(false)
    }
  }, [evtId])
  useEffect(() => {
    void charger()
  }, [charger])
  useEffect(() => () => apercusTemporaires.current.forEach((url) => URL.revokeObjectURL(url)), [])
  useEffect(() => {
    const obsolete = Object.entries(apercus).filter(([nom]) => !nomsImages.has(nom))
    if (!obsolete.length) return
    obsolete.forEach(([, url]) => {
      URL.revokeObjectURL(url)
      apercusTemporaires.current.delete(url)
    })
    setApercus((courant) => Object.fromEntries(Object.entries(courant).filter(([nom]) => nomsImages.has(nom))))
  }, [apercus, nomsImages])

  const surApercu = useCallback((nom: string, url: string) => {
    apercusTemporaires.current.add(url)
    setApercus((a) => ({ ...a, [nom]: url }))
  }, [])
  const modelePropose: CleModele = modele ?? (evt?.type === 'CADRE' ? 'RENCONTRE' : 'SOIREE')
  const urlImage = useMemo(() => (nom: string) => apercus[nom] ?? `${window.location.origin}/api/evenements/${evtId}/page/images/${nom}`, [apercus, evtId])

  if (chargement) return <ChargementPage />
  if (erreur || !evt) return <Alerte ton="erreur">{erreur ?? 'Événement introuvable'}</Alerte>
  const verrouille = evt.statut === 'ANNULE' || evt.statut === 'TERMINE'
  const sections = config.sections
  const presents = new Set(sections.map((s) => s.type))

  const changer = (p: Partial<PageConfig>) => {
    setConfig((c) => ({ ...c, ...p }))
    setModifie(true)
  }
  const majSection = (s: SectionConfig) => changer({ sections: sections.map((x) => (x.id === s.id ? s : x)) })
  const deplacerSection = (index: number, direction: -1 | 1) => {
    const cible = index + direction
    if (cible < 0 || cible >= sections.length) return
    const ordre = [...sections]
    ;[ordre[index], ordre[cible]] = [ordre[cible], ordre[index]]
    changer({ sections: ordre })
  }
  const ajouter = (type: TypeSection) => {
    const s = nouvelleSection(type)
    changer({ sections: [...sections, s] })
    setOuverte(s.id)
  }
  const apparence = config.apparence ?? {}
  const majApparence = (p: NonNullable<PageConfig['apparence']>) => changer({ apparence: { ...apparence, ...p } })
  const paletteChoisie = PALETTES_PAGE.find((p) =>
    p.couleurPrincipale === (apparence.couleurPrincipale ?? null) &&
    p.couleurSecondaire === (apparence.couleurSecondaire ?? null) &&
    p.couleurBloc === (apparence.couleurBloc ?? null) &&
    p.opaciteBloc === (apparence.opaciteBloc ?? 62) &&
    p.couleurEntete === (apparence.couleurEntete ?? null) &&
    p.couleurTexteEntete === (apparence.couleurTexteEntete ?? null) &&
    p.couleurFondPage === (apparence.couleurFondPage ?? null) &&
    p.couleurPied === (apparence.couleurPied ?? null) &&
    p.couleurTextePied === (apparence.couleurTextePied ?? null) &&
    p.couleurTexte === (apparence.couleurTexte ?? null) &&
    p.couleurCarte === (apparence.couleurCarte ?? null) &&
    p.couleurBouton === (apparence.couleurBouton ?? null),
  )?.cle

  async function enregistrer() {
    setEnCours(true)
    try {
      await adminEvenementService.definirApparence(evtId, evt!.ambiance ?? null, config.apparence?.couleurPrincipale ?? null, modelePropose)
      const propre = await adminEvenementService.enregistrerPage(evtId, config)
      setConfig(propre)
      setModifie(false)
      toast.succes('Page enregistrée')
    } catch (e) {
      toast.erreur(messageErreur(e))
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1500px]">
      <Link to="/admin/evenements" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold hover:text-rouge">
        <Icone nom="arrow_back" taille={18} /> Événements
      </Link>
      <EnteteSection
        icone="web"
        titre={`Page de « ${evt.titre} »`}
        sousTitre="Choisissez le type de page, puis ajoutez les sections que vous voulez. Tout est facultatif."
        actions={
          <>
            <Link to={`/evenements/${evtId}`} target="_blank" rel="noreferrer" className={classeBouton('secondaire')}>
              <Icone nom="open_in_new" taille={18} /> Voir la page
            </Link>
            <Bouton variante="succes" icone="save" enCours={enCours} disabled={verrouille || !modifie} onClick={enregistrer}>
              Enregistrer
            </Bouton>
          </>
        }
      />
      <EtapesEvenement etape={evt.type === 'CADRE' ? 3 : 2} programme={evt.type === 'CADRE'} />
      {verrouille && <Alerte ton="attention">Cet événement est {evt.statut === 'ANNULE' ? 'annulé' : 'terminé'} : sa page ne peut plus être modifiée.</Alerte>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="flex flex-col gap-6">
          {/* 1. Type de page */}
          <section className="carte p-5">
            <h2 className="mb-1 text-lg font-bold">1. Type de page</h2>
            <p className="mb-4 text-sm text-attenue">Chaque type a sa propre mise en page. Cliquez sur « Voir un exemple » pour la découvrir.</p>
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Type de page">
              {MODELES.map((m) => {
                const actif = modelePropose === m.cle
                return (
                  <div key={m.cle} className={`flex flex-col rounded-xl border-2 p-3 transition ${actif ? 'border-orange-400 bg-yellow-50' : 'border-neutral-200 bg-white hover:border-orange-200'}`}>
                    <div aria-hidden="true" className="relative mb-3 flex h-16 items-end overflow-hidden rounded-lg border border-black/5 p-2.5" style={{ background: APERCUS_MODELE[m.cle] }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                      <span className="relative text-[10px] font-bold uppercase tracking-[.18em] text-white/90">{m.cle}</span>
                      <span className="relative ml-auto flex items-end gap-1">{[10, 17, 12, 22, 14].map((h, i) => <i key={i} className="w-1 rounded-t bg-white/80" style={{ height: h }} />)}</span>
                    </div>
                    <label className="flex flex-1 cursor-pointer flex-col text-left outline-none focus-within:ring-2 focus-within:ring-orange-400">
                      <input
                        type="radio"
                        name="modelePage"
                        value={m.cle}
                        checked={actif}
                        disabled={verrouille}
                        onChange={() => { setModele(m.cle); setModifie(true) }}
                        className="sr-only"
                      />
                      <span className="flex items-center gap-2 font-bold">
                        <Icone nom={actif ? 'radio_button_checked' : 'radio_button_unchecked'} className={actif ? 'text-orange-500' : 'text-neutral-400'} /> {m.nom}
                      </span>
                      <span className="mt-1 block text-xs text-attenue">{m.pourQui}</span>
                    </label>
                    <Link to={`/apercu-modele/${m.cle.toLowerCase()}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-orange-600 underline">
                      <Icone nom="visibility" taille={16} /> Voir un exemple
                    </Link>
                  </div>
                )
              })}
            </div>
          </section>

          {/* 2. Apparence */}
          <section className="carte p-5">
            <h2 className="mb-1 text-lg font-bold">2. Couleurs et image de fond</h2>
            <p className="mb-4 text-sm text-attenue">Choisissez une combinaison prête à l’emploi ou ajustez les couleurs. L’image de la section « Bannière » sert de fond au grand visuel et reçoit le voile choisi ici.</p>
            <fieldset disabled={verrouille} className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {PALETTES_PAGE.map((p) => {
                  const active = paletteChoisie === p.cle
                  return (
                    <button
                      key={p.cle}
                      type="button"
                      aria-pressed={active}
                      onClick={() => majApparence({ couleurPrincipale: p.couleurPrincipale, couleurSecondaire: p.couleurSecondaire, couleurBloc: p.couleurBloc, opaciteBloc: p.opaciteBloc, couleurEntete: p.couleurEntete, couleurTexteEntete: p.couleurTexteEntete, couleurFondPage: p.couleurFondPage, couleurPied: p.couleurPied, couleurTextePied: p.couleurTextePied, couleurTexte: p.couleurTexte, couleurCarte: p.couleurCarte, couleurBouton: p.couleurBouton })}
                      className={`rounded-xl border-2 p-3 text-left transition ${active ? 'border-orange-400 bg-yellow-50' : 'border-neutral-200 hover:border-neutral-400'}`}
                    >
                      <span className="mb-2 flex items-center gap-2">
                        <span className="flex -space-x-1">
                          <i className="h-5 w-5 rounded-full border-2 border-white" style={{ backgroundColor: p.couleurPrincipale ?? '#334155' }} />
                          <i className="h-5 w-5 rounded-full border-2 border-white" style={{ backgroundColor: p.couleurSecondaire ?? '#cbd5e1' }} />
                          <i title="Voile" className="h-5 w-5 rounded-full border-2 border-white" style={{ backgroundColor: p.couleurBloc ?? '#0f172a' }} />
                          <i title="En-tête" className="h-5 w-5 rounded-full border-2 border-white" style={{ backgroundColor: p.couleurEntete ?? '#475569' }} />
                          <i title="Carte" className="h-5 w-5 rounded-full border-2 border-white" style={{ backgroundColor: p.couleurCarte ?? '#ffffff' }} />
                        </span>
                        <strong className="text-sm">{p.nom}</strong>
                      </span>
                      <span className="block text-xs text-attenue">{p.detail}</span>
                    </button>
                  )
                })}
              </div>
              <div className="flex flex-col gap-4 rounded-xl bg-neutral-50 p-4">
                <div>
                  <p className="mb-2 text-sm font-bold">Zones générales</p>
                  <p className="mb-3 text-xs text-attenue">Chaque réglage ne recolore que la zone nommée. Les blocs disposent aussi de leurs propres couleurs plus bas.</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <ChampCouleur libelle="En-tête" valeur={apparence.couleurEntete} defaut="#172554" surChangement={(v) => majApparence({ couleurEntete: v })} />
                    <ChampCouleur libelle="Texte de l’en-tête" valeur={apparence.couleurTexteEntete} defaut="#ffffff" surChangement={(v) => majApparence({ couleurTexteEntete: v })} />
                    <ChampCouleur libelle="Fond de page" valeur={apparence.couleurFondPage} defaut="#f8fafc" surChangement={(v) => majApparence({ couleurFondPage: v })} />
                    <ChampCouleur libelle="Texte général" valeur={apparence.couleurTexte} defaut="#172033" surChangement={(v) => majApparence({ couleurTexte: v })} />
                    <ChampCouleur libelle="Fond des cartes" valeur={apparence.couleurCarte} defaut="#ffffff" surChangement={(v) => majApparence({ couleurCarte: v })} />
                    <ChampCouleur libelle="Boutons" valeur={apparence.couleurBouton} defaut={apparence.couleurPrincipale ?? '#2563eb'} surChangement={(v) => majApparence({ couleurBouton: v })} />
                    <ChampCouleur libelle="Pied de page" valeur={apparence.couleurPied} defaut="#111827" surChangement={(v) => majApparence({ couleurPied: v })} />
                    <ChampCouleur libelle="Texte du pied de page" valeur={apparence.couleurTextePied} defaut="#ffffff" surChangement={(v) => majApparence({ couleurTextePied: v })} />
                  </div>
                </div>
                <div className="border-t border-neutral-200 pt-3">
                  <p className="mb-2 text-sm font-bold">Accent et bannière</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <ChampCouleur libelle="Accent / liens actifs" valeur={apparence.couleurPrincipale} defaut="#2563eb" surChangement={(v) => majApparence({ couleurPrincipale: v })} />
                    <ChampCouleur libelle="Titres / détails" valeur={apparence.couleurSecondaire} defaut="#60a5fa" surChangement={(v) => majApparence({ couleurSecondaire: v })} />
                    <ChampCouleur libelle="Voile de l’image hero" valeur={apparence.couleurBloc} defaut="#21133b" surChangement={(v) => majApparence({ couleurBloc: v })} />
                    <label className="flex flex-col justify-center gap-1 rounded-lg bg-white px-3 py-2 text-xs font-semibold">
                      <span className="flex justify-between">Intensité du voile <span>{apparence.opaciteBloc ?? 62}%</span></span>
                      <input aria-label="Intensité du voile sur l’image" type="range" min={20} max={90} value={apparence.opaciteBloc ?? 62} onChange={(e) => majApparence({ opaciteBloc: Number(e.target.value) })} className="w-full accent-orange-400" />
                    </label>
                  </div>
                </div>
              </div>
            </fieldset>
          </section>

          {/* 3. Sections */}
          <section className="carte p-5">
            <h2 className="mb-1 text-lg font-bold">3. Sections de la page</h2>
            <p className="mb-4 text-sm text-attenue">
              {sections.length === 0
                ? 'La page de base est prête. Ajoute des blocs depuis la bibliothèque ci-dessous; tu verras chaque changement dans l’aperçu.'
                : 'Réorganise les blocs avec les flèches, modifie leur contenu ou masque ceux que tu ne veux pas afficher.'}
            </p>

            <div className="flex flex-col gap-3">
              {sections.map((s, index) => {
                const info = TYPES_SECTION[s.type]
                const ouvert = ouverte === s.id
                return (
                  <article key={s.id} className={`rounded-xl border ${s.actif ? 'border-neutral-300' : 'border-neutral-200 opacity-70'}`}>
                    <header className="flex items-center gap-3 px-4 py-3">
                      <button type="button" className="flex flex-1 items-center gap-3 text-left" aria-expanded={ouvert} onClick={() => setOuverte(ouvert ? null : s.id)}>
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-100 text-orange-600">
                          <Icone nom={info.icone} taille={20} />
                        </span>
                        <span>
                          <span className="block font-bold">{info.libelle}</span>
                          <span className="block text-xs text-attenue">{s.titre || info.aide}</span>
                        </span>
                        <Icone nom={ouvert ? 'expand_less' : 'expand_more'} className="ml-auto text-attenue" />
                      </button>
                      <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold">
                        <input type="checkbox" checked={s.actif} disabled={verrouille} onChange={(e) => majSection({ ...s, actif: e.target.checked })} />
                        Affichée
                      </label>
                      <div className="flex items-center gap-1" aria-label="Ordre du bloc">
                        <button type="button" disabled={verrouille || index === 0} onClick={() => deplacerSection(index, -1)} aria-label={`Monter ${info.libelle}`} className="rounded-md p-1.5 text-neutral-600 hover:bg-yellow-50 hover:text-orange-600 disabled:opacity-30">
                          <Icone nom="arrow_upward" taille={18} />
                        </button>
                        <button type="button" disabled={verrouille || index === sections.length - 1} onClick={() => deplacerSection(index, 1)} aria-label={`Descendre ${info.libelle}`} className="rounded-md p-1.5 text-neutral-600 hover:bg-yellow-50 hover:text-orange-600 disabled:opacity-30">
                          <Icone nom="arrow_downward" taille={18} />
                        </button>
                      </div>
                      <Bouton
                        variante="fantome"
                        taille="petit"
                        icone="delete"
                        disabled={verrouille}
                        aria-label={`Supprimer la section ${info.libelle}`}
                        onClick={() => {
                          changer({ sections: sections.filter((x) => x.id !== s.id) })
                          setOuverte(null)
                        }}
                      />
                    </header>
                    {ouvert && (
                      <div className="border-t border-neutral-200 p-4">
                        <fieldset disabled={verrouille}>
                          <EditeurSection evenementId={evtId} section={s} surChangement={majSection} apercus={apercus} surApercu={surApercu} estProgramme={evt.type === 'CADRE'} />
                        </fieldset>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>

            {!verrouille && (
              <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="mb-3">
                  <p className="text-sm font-bold text-neutral-800">Bibliothèque de blocs</p>
                  <p className="mt-1 text-xs text-neutral-500">Clique sur un bloc pour l’ajouter à ta page; tu pourras ensuite le modifier et le déplacer.</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {ORDRE.filter((t) => ['TEXTE', 'CARTES', 'COLONNES'].includes(t) || !presents.has(t)).map((t) => {
                    const info = TYPES_SECTION[t]
                    return (
                      <button key={t} type="button" title={info.aide} onClick={() => ajouter(t)} className="group flex min-h-16 items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-100 text-orange-600"><Icone nom={info.icone} taille={20} /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-neutral-800">{info.libelle}</span>
                          <span className="mt-0.5 block text-[11px] leading-snug text-neutral-500">{info.aide}</span>
                        </span>
                        <Icone nom="add" taille={18} className="shrink-0 text-neutral-400 group-hover:text-orange-500" />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Aperçu en direct */}
        <aside className="xl:sticky xl:top-24 xl:self-start">
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/10">
            <div className="flex items-center justify-between gap-3 border-b border-black/10 bg-neutral-100 px-4 py-2 text-sm">
              <span className="font-semibold">Aperçu en direct · {MODELES.find((m) => m.cle === modelePropose)?.nom}</span>
              {modifie && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">Non enregistré</span>}
            </div>
            <div className="h-[75vh] min-h-[420px]">
              <PageSite evenement={evt} elements={elements} config={config} modele={modelePropose} surReserver={() => undefined} surOuvrir={() => undefined} urlImage={urlImage} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
