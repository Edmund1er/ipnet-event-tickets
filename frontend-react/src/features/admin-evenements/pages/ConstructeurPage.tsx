import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { adminEvenementService } from '../services/adminEvenementService'

const ORDRE: TypeSection[] = ['HERO', 'A_PROPOS', 'INTERVENANTS', 'PROGRAMME', 'LIEU', 'TEXTE']

function nouvelleSection(type: TypeSection): SectionConfig {
  return { id: `${type.toLowerCase()}-${Math.random().toString(36).slice(2, 8)}`, type, actif: true, intervenants: [], creneaux: [] }
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

  const surApercu = useCallback((nom: string, url: string) => setApercus((a) => ({ ...a, [nom]: url })), [])
  const modelePropose: CleModele = modele ?? (evt?.type === 'CADRE' ? 'RENCONTRE' : 'CEREMONIE')
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
  const ajouter = (type: TypeSection) => {
    const s = nouvelleSection(type)
    changer({ sections: [...sections, s] })
    setOuverte(s.id)
  }

  async function enregistrer() {
    setEnCours(true)
    try {
      await adminEvenementService.definirApparence(evtId, evt!.ambiance ?? null, evt!.couleurPrincipale ?? null, modelePropose)
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
                  <div key={m.cle} className={`flex flex-col rounded-xl border-2 p-3 transition ${actif ? 'border-indigo-600 bg-indigo-50' : 'border-neutral-200 bg-white hover:border-neutral-400'}`}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={actif}
                      disabled={verrouille}
                      onClick={() => {
                        setModele(m.cle)
                        setModifie(true)
                      }}
                      className="flex-1 text-left"
                    >
                      <span className="flex items-center gap-2 font-bold">
                        <Icone nom={actif ? 'radio_button_checked' : 'radio_button_unchecked'} className={actif ? 'text-indigo-600' : 'text-neutral-400'} /> {m.nom}
                      </span>
                      <span className="mt-1 block text-xs text-attenue">{m.pourQui}</span>
                    </button>
                    <Link to={`/apercu-modele/${m.cle.toLowerCase()}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 underline">
                      <Icone nom="visibility" taille={16} /> Voir un exemple
                    </Link>
                  </div>
                )
              })}
            </div>
          </section>

          {/* 2. Sections */}
          <section className="carte p-5">
            <h2 className="mb-1 text-lg font-bold">2. Sections de la page</h2>
            <p className="mb-4 text-sm text-attenue">
              {sections.length === 0
                ? 'Aucune section : la page de base s’affiche toute seule (titre, date, lieu, description, programme). Ajoutez des sections pour la personnaliser.'
                : 'Seules les sections ajoutées et activées s’affichent, en plus du titre, de la date et de la réservation.'}
            </p>

            <div className="flex flex-col gap-3">
              {sections.map((s) => {
                const info = TYPES_SECTION[s.type]
                const ouvert = ouverte === s.id
                return (
                  <article key={s.id} className={`rounded-xl border ${s.actif ? 'border-neutral-300' : 'border-neutral-200 opacity-70'}`}>
                    <header className="flex items-center gap-3 px-4 py-3">
                      <button type="button" className="flex flex-1 items-center gap-3 text-left" aria-expanded={ouvert} onClick={() => setOuverte(ouvert ? null : s.id)}>
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-800 text-white">
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
              <div className="mt-5">
                <p className="etiquette">Ajouter une section</p>
                <div className="flex flex-wrap gap-2">
                  {ORDRE.filter((t) => t === 'TEXTE' || !presents.has(t)).map((t) => (
                    <Bouton key={t} variante="secondaire" taille="petit" icone={TYPES_SECTION[t].icone} title={TYPES_SECTION[t].aide} onClick={() => ajouter(t)}>
                      {TYPES_SECTION[t].libelle}
                    </Bouton>
                  ))}
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
