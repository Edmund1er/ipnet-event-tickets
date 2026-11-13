import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { messageErreur } from '../../../core/api/httpClient'
import type { Evenement } from '../../../core/api/types'
import { Badge } from '../../../core/components/ui/Badge'
import { Bouton } from '../../../core/components/ui/Bouton'
import { Champ, ChampSelection, ChampTexte } from '../../../core/components/ui/Champ'
import { ChargementPage } from '../../../core/components/ui/Chargement'
import { Alerte, EnteteSection, Modale } from '../../../core/components/ui/Divers'
import { Icone } from '../../../core/components/ui/Icone'
import { useToast } from '../../../core/components/ui/Toasts'
import { STATUTS_EVENEMENT } from '../../../core/constants/statuts'
import { heure, montant } from '../../../core/utils/format'
import { libelleTarif } from '../../evenements/components/ProgrammeEvenement'
import { AMBIANCES, CLES_AMBIANCE } from '../../evenements/theme/ambiances'
import { CATEGORIES, CLES_CATEGORIE, categorieDe } from '../../evenements/theme/categories'
import { adminEvenementService, type DonneesActivite } from '../services/adminEvenementService'

type Mode = 'PAYANT' | 'GRATUIT' | 'LIBRE'

interface Formulaire {
  titre: string
  description: string
  categorie: string
  jour: string
  debut: string
  fin: string
  lieu: string
  mode: Mode
  prix: string
  capacite: string
  ambiance: string
  couleur: string
}

const VIDE: Formulaire = { titre: '', description: '', categorie: 'CULTURE', jour: '', debut: '08:00', fin: '09:00', lieu: '', mode: 'GRATUIT', prix: '', capacite: '', ambiance: '', couleur: '' }

const cleJour = (iso: string) => iso.slice(0, 10)
const libelleJour = (cle: string) => new Date(`${cle}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

function joursEntre(debut: string, fin: string): string[] {
  const jours: string[] = []
  const d = new Date(`${cleJour(debut)}T12:00:00`)
  const dernier = cleJour(fin)
  for (let i = 0; i < 90; i++) {
    const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    jours.push(cle)
    if (cle >= dernier) break
    d.setDate(d.getDate() + 1)
  }
  return jours
}

export function ProgrammeAdminPage() {
  const { id } = useParams()
  const toast = useToast()
  const [cadre, setCadre] = useState<Evenement | null>(null)
  const [elements, setElements] = useState<Evenement[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)

  // Activité : création ou modification
  const [formActivite, setFormActivite] = useState<{ edition: Evenement | null } | null>(null)
  const [f, setF] = useState<Formulaire>(VIDE)
  const [personnaliser, setPersonnaliser] = useState(false)
  // Pass
  const [formPass, setFormPass] = useState<{ edition: Evenement | null } | null>(null)
  const [pass, setPass] = useState({ titre: '', portee: 'GLOBAL' as 'GLOBAL' | 'JOURNEE', jour: '', prix: '', capacite: '' })
  // Duplication
  const [duplication, setDuplication] = useState<{ source: string; cibles: string[] } | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [erreurForm, setErreurForm] = useState<string | null>(null)

  const charger = useCallback(async () => {
    try {
      const [c, liste] = await Promise.all([adminEvenementService.detail(Number(id)), adminEvenementService.activites(Number(id))])
      setCadre(c)
      setElements(liste)
    } catch (e) {
      setErreur(messageErreur(e))
    } finally {
      setChargement(false)
    }
  }, [id])
  useEffect(() => {
    void charger()
  }, [charger])

  const jours = useMemo(() => (cadre ? joursEntre(cadre.dateDebut, cadre.dateFin ?? cadre.dateDebut) : []), [cadre])
  const activites = elements.filter((e) => e.type === 'ACTIVITE')
  const passes = elements.filter((e) => e.type === 'PASS')
  const parJour = useMemo(() => {
    const m = new Map<string, Evenement[]>()
    for (const a of activites) m.set(cleJour(a.dateDebut), [...(m.get(cleJour(a.dateDebut)) ?? []), a])
    return m
  }, [activites])

  if (chargement) return <ChargementPage />
  if (erreur || !cadre) return <Alerte ton="erreur">{erreur ?? 'Programme introuvable'}</Alerte>
  if (cadre.type !== 'CADRE') return <Alerte ton="attention">Cet événement n'est pas un programme sur plusieurs jours.</Alerte>
  const verrouille = cadre.statut === 'ANNULE' || cadre.statut === 'TERMINE'

  function ouvrirActivite(edition: Evenement | null, jourDefaut?: string) {
    setErreurForm(null)
    if (edition) {
      setF({
        titre: edition.titre,
        description: edition.description ?? '',
        categorie: edition.categorie ?? 'AUTRE',
        jour: cleJour(edition.dateDebut),
        debut: edition.dateDebut.slice(11, 16),
        fin: (edition.dateFin ?? edition.dateDebut).slice(11, 16),
        lieu: edition.lieu ?? '',
        mode: edition.accesLibre ? 'LIBRE' : edition.prix > 0 ? 'PAYANT' : 'GRATUIT',
        prix: edition.prix > 0 ? String(edition.prix) : '',
        capacite: edition.accesLibre ? '' : String(edition.capacite),
        ambiance: edition.ambiance ?? '',
        couleur: edition.couleurPrincipale ?? '',
      })
      setPersonnaliser(!!(edition.ambiance || edition.couleurPrincipale))
    } else {
      setF({ ...VIDE, jour: jourDefaut ?? jours[0] ?? '', lieu: cadre?.lieu ?? '' })
      setPersonnaliser(false)
    }
    setFormActivite({ edition })
  }

  async function enregistrerActivite() {
    if (!formActivite || !cadre) return
    if (!f.titre.trim()) return setErreurForm('Le titre est obligatoire')
    if (!f.jour) return setErreurForm('Choisissez le jour')
    if (f.fin <= f.debut) return setErreurForm("L'heure de fin doit suivre l'heure de début")
    if (f.mode === 'PAYANT' && !(Number(f.prix) > 0)) return setErreurForm('Indiquez le prix')
    if (f.mode !== 'LIBRE' && !(Number(f.capacite) >= 1)) return setErreurForm('Indiquez le nombre de places')
    const d: DonneesActivite = {
      type: 'ACTIVITE',
      titre: f.titre.trim(),
      description: f.description,
      categorie: f.categorie,
      dateDebut: `${f.jour}T${f.debut}:00`,
      dateFin: `${f.jour}T${f.fin}:00`,
      lieu: f.lieu.trim(),
      prix: f.mode === 'PAYANT' ? Number(f.prix) : 0,
      capacite: f.mode === 'LIBRE' ? null : Number(f.capacite),
      accesLibre: f.mode === 'LIBRE',
      passPortee: null,
      passJour: null,
      ambiance: personnaliser && f.ambiance ? f.ambiance : null,
      couleurPrincipale: personnaliser && f.couleur ? f.couleur : null,
    }
    setEnCours(true)
    setErreurForm(null)
    try {
      if (formActivite.edition) await adminEvenementService.modifierActivite(formActivite.edition.id, d)
      else await adminEvenementService.creerActivite(cadre.id, d)
      toast.succes(formActivite.edition ? 'Activité modifiée' : 'Activité ajoutée')
      setFormActivite(null)
      await charger()
    } catch (e) {
      setErreurForm(messageErreur(e))
    } finally {
      setEnCours(false)
    }
  }

  function ouvrirPass(edition: Evenement | null) {
    setErreurForm(null)
    setPass(
      edition
        ? { titre: edition.titre, portee: edition.passPortee ?? 'GLOBAL', jour: edition.passJour ?? '', prix: String(edition.prix), capacite: String(edition.capacite) }
        : { titre: '', portee: 'GLOBAL', jour: jours[0] ?? '', prix: '', capacite: '' },
    )
    setFormPass({ edition })
  }

  async function enregistrerPass() {
    if (!formPass || !cadre) return
    if (!(Number(pass.prix) >= 0) || pass.prix === '') return setErreurForm('Indiquez le prix')
    if (!(Number(pass.capacite) >= 1)) return setErreurForm('Indiquez le nombre de pass disponibles')
    if (pass.portee === 'JOURNEE' && !pass.jour) return setErreurForm('Choisissez le jour')
    const titre = pass.titre.trim() || (pass.portee === 'GLOBAL' ? 'Pass complet' : `Pass du ${libelleJour(pass.jour)}`)
    const d: DonneesActivite = {
      type: 'PASS',
      titre,
      description: '',
      categorie: null,
      dateDebut: cadre.dateDebut,
      dateFin: cadre.dateFin ?? cadre.dateDebut,
      lieu: '',
      prix: Number(pass.prix),
      capacite: Number(pass.capacite),
      accesLibre: false,
      passPortee: pass.portee,
      passJour: pass.portee === 'JOURNEE' ? pass.jour : null,
      ambiance: null,
      couleurPrincipale: null,
    }
    setEnCours(true)
    setErreurForm(null)
    try {
      if (formPass.edition) await adminEvenementService.modifierActivite(formPass.edition.id, d)
      else await adminEvenementService.creerActivite(cadre.id, d)
      toast.succes('Pass enregistré')
      setFormPass(null)
      await charger()
    } catch (e) {
      setErreurForm(messageErreur(e))
    } finally {
      setEnCours(false)
    }
  }

  async function supprimer(e: Evenement) {
    if (!window.confirm(`Supprimer « ${e.titre} » ?`)) return
    try {
      await adminEvenementService.supprimerActivite(e.id)
      toast.succes('Supprimé')
      await charger()
    } catch (err) {
      toast.erreur(messageErreur(err))
    }
  }

  async function dupliquer() {
    if (!duplication || !cadre) return
    if (duplication.cibles.length === 0) return setErreurForm('Choisissez au moins un jour')
    setEnCours(true)
    setErreurForm(null)
    try {
      const crees = await adminEvenementService.dupliquerJour(cadre.id, duplication.source, duplication.cibles)
      toast.succes(`${crees.length} activité${crees.length > 1 ? 's' : ''} créée${crees.length > 1 ? 's' : ''}`)
      setDuplication(null)
      await charger()
    } catch (e) {
      setErreurForm(messageErreur(e))
    } finally {
      setEnCours(false)
    }
  }

  const maj = (cle: keyof Formulaire) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [cle]: e.target.value }))

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/admin/evenements" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold hover:text-rouge">
        <Icone nom="arrow_back" taille={18} /> Événements
      </Link>
      <EnteteSection
        icone="calendar_view_week"
        titre={cadre.titre}
        sousTitre={`Programme du ${new Date(cadre.dateDebut).toLocaleDateString('fr-FR')} au ${new Date(cadre.dateFin ?? cadre.dateDebut).toLocaleDateString('fr-FR')} · ${activites.length} activité${activites.length > 1 ? 's' : ''}`}
        actions={
          !verrouille && (
            <>
              <Link to={`/admin/evenements/${cadre.id}`} className="inline-flex h-11 items-center gap-2 rounded-lg border-[1.5px] border-primaire px-4 font-semibold text-primaire hover:bg-primaire-clair">
                <Icone nom="edit" taille={18} /> Infos et apparence
              </Link>
              <Bouton icone="add" onClick={() => ouvrirActivite(null)}>
                Ajouter une activité
              </Bouton>
            </>
          )
        }
      />
      <div className="mb-4 flex items-center gap-2">
        <Badge ton={STATUTS_EVENEMENT[cadre.statut].ton}>{STATUTS_EVENEMENT[cadre.statut].libelle}</Badge>
        {cadre.statut === 'BROUILLON' && <span className="text-sm text-attenue">Publiez le programme depuis la liste des événements : ses activités et pass seront publiés avec lui.</span>}
      </div>

      <section className="carte mb-6 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pass</h2>
          {!verrouille && (
            <Bouton taille="petit" variante="secondaire" icone="add" onClick={() => ouvrirPass(null)}>
              Ajouter un pass
            </Bouton>
          )}
        </div>
        {passes.length === 0 ? (
          <p className="text-sm text-attenue">Aucun pass. Sans pass, les participants réservent activité par activité.</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {passes.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-2">
                <Icone nom="confirmation_number" className="text-rouge" />
                <span className="flex-1 font-semibold">{p.titre}</span>
                <span className="text-sm text-attenue">{p.passPortee === 'JOURNEE' && p.passJour ? libelleJour(p.passJour) : 'Tout le programme'}</span>
                <span className="font-semibold">{montant(p.prix, p.devise)}</span>
                <span className="chiffres text-sm text-attenue">
                  {p.placesReservees} / {p.capacite}
                </span>
                {!verrouille && (
                  <>
                    <Bouton taille="petit" variante="fantome" icone="edit" onClick={() => ouvrirPass(p)} aria-label={`Modifier ${p.titre}`} />
                    <Bouton taille="petit" variante="fantome" icone="delete" onClick={() => supprimer(p)} aria-label={`Supprimer ${p.titre}`} />
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {jours.map((j) => {
        const liste = (parJour.get(j) ?? []).sort((a, b) => a.dateDebut.localeCompare(b.dateDebut))
        return (
          <section key={j} className="carte mb-4 p-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold capitalize">{libelleJour(j)}</h2>
              {!verrouille && (
                <div className="flex gap-1">
                  <Bouton taille="petit" variante="fantome" icone="add" onClick={() => ouvrirActivite(null, j)}>
                    Activité
                  </Bouton>
                  {liste.length > 0 && jours.length > 1 && (
                    <Bouton taille="petit" variante="fantome" icone="content_copy" onClick={() => { setErreurForm(null); setDuplication({ source: j, cibles: [] }) }}>
                      Dupliquer ce jour
                    </Bouton>
                  )}
                </div>
              )}
            </div>
            {liste.length === 0 ? (
              <p className="text-sm text-attenue">Aucune activité.</p>
            ) : (
              <ul className="divide-y divide-black/5">
                {liste.map((a) => {
                  const cat = categorieDe(a.categorie)
                  return (
                    <li key={a.id} className="flex flex-wrap items-center gap-3 py-2">
                      <span className="chiffres w-28 shrink-0 text-sm font-semibold">
                        {heure(a.dateDebut)} – {heure(a.dateFin)}
                      </span>
                      <span className="shrink-0" style={{ color: a.couleurPrincipale ?? cat.couleur }}><Icone nom={cat.icone} taille={20} /></span>
                      <span className="min-w-0 flex-1 truncate font-medium">{a.titre}</span>
                      <span className="text-sm text-attenue">{libelleTarif(a)}</span>
                      {!a.accesLibre && (
                        <span className="chiffres text-sm text-attenue">
                          {a.placesReservees} / {a.capacite}
                        </span>
                      )}
                      <Badge ton={STATUTS_EVENEMENT[a.statut].ton}>{STATUTS_EVENEMENT[a.statut].libelle}</Badge>
                      {!verrouille && (
                        <>
                          <Bouton taille="petit" variante="fantome" icone="edit" onClick={() => ouvrirActivite(a)} aria-label={`Modifier ${a.titre}`} />
                          <Bouton taille="petit" variante="fantome" icone="delete" onClick={() => supprimer(a)} aria-label={`Supprimer ${a.titre}`} />
                        </>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}

      {/* ---- Activité ---- */}
      <Modale
        ouverte={!!formActivite}
        titre={formActivite?.edition ? "Modifier l'activité" : 'Nouvelle activité'}
        surFermeture={() => setFormActivite(null)}
        large
        pied={
          <>
            <Bouton variante="fantome" onClick={() => setFormActivite(null)}>
              Annuler
            </Bouton>
            <Bouton icone="save" enCours={enCours} onClick={enregistrerActivite}>
              Enregistrer
            </Bouton>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {erreurForm && <Alerte ton="erreur">{erreurForm}</Alerte>}
          <Champ libelle="Titre" value={f.titre} onChange={maj('titre')} maxLength={200} />
          <div className="grid gap-4 sm:grid-cols-2">
            <ChampSelection libelle="Catégorie" value={f.categorie} onChange={maj('categorie')}>
              {CLES_CATEGORIE.map((c) => (
                <option key={c} value={c}>
                  {CATEGORIES[c].libelle}
                </option>
              ))}
            </ChampSelection>
            <ChampSelection libelle="Jour" value={f.jour} onChange={maj('jour')}>
              {jours.map((j) => (
                <option key={j} value={j}>
                  {libelleJour(j)}
                </option>
              ))}
            </ChampSelection>
            <Champ libelle="Début" type="time" value={f.debut} onChange={maj('debut')} />
            <Champ libelle="Fin" type="time" value={f.fin} onChange={maj('fin')} />
          </div>
          <Champ libelle="Lieu" facultatif value={f.lieu} onChange={maj('lieu')} maxLength={255} />
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold">Accès</legend>
            {(
              [
                ['GRATUIT', 'Gratuit, sur inscription', 'Les étudiants s’inscrivent et reçoivent un billet.'],
                ['PAYANT', 'Payant', 'Billet payé par Mobile Money.'],
                ['LIBRE', 'Accès libre', 'Aucune inscription : l’activité est simplement affichée.'],
              ] as [Mode, string, string][]
            ).map(([m, titre, texte]) => (
              <label key={m} className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 ${f.mode === m ? 'border-primaire bg-primaire-clair' : 'border-black/10'}`}>
                <input type="radio" name="mode" checked={f.mode === m} onChange={() => setF((x) => ({ ...x, mode: m }))} className="mt-1" />
                <span>
                  <span className="block font-semibold">{titre}</span>
                  <span className="block text-xs text-attenue">{texte}</span>
                </span>
              </label>
            ))}
          </fieldset>
          {f.mode !== 'LIBRE' && (
            <div className="grid gap-4 sm:grid-cols-2">
              {f.mode === 'PAYANT' && <Champ libelle={`Prix (${cadre.devise})`} type="number" min={1} value={f.prix} onChange={maj('prix')} />}
              <Champ libelle="Nombre de places" type="number" min={1} value={f.capacite} onChange={maj('capacite')} />
            </div>
          )}
          <ChampTexte libelle="Description" facultatif rows={3} value={f.description} onChange={maj('description')} />
          <div>
            <button type="button" onClick={() => setPersonnaliser((v) => !v)} className="text-sm font-semibold text-primaire underline">
              {personnaliser ? 'Utiliser le style de la catégorie' : 'Personnaliser le visuel (facultatif)'}
            </button>
            {personnaliser && (
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <ChampSelection libelle="Ambiance" value={f.ambiance} onChange={maj('ambiance')}>
                  <option value="">Celle du programme</option>
                  {CLES_AMBIANCE.map((c) => (
                    <option key={c} value={c}>
                      {AMBIANCES[c].libelle}
                    </option>
                  ))}
                </ChampSelection>
                <label className="flex items-center gap-3 text-sm font-semibold">
                  Couleur
                  <input type="color" value={f.couleur || categorieDe(f.categorie).couleur} onChange={maj('couleur')} className="h-10 w-14 cursor-pointer rounded border" />
                </label>
              </div>
            )}
          </div>
        </div>
      </Modale>

      {/* ---- Pass ---- */}
      <Modale
        ouverte={!!formPass}
        titre={formPass?.edition ? 'Modifier le pass' : 'Nouveau pass'}
        surFermeture={() => setFormPass(null)}
        pied={
          <>
            <Bouton variante="fantome" onClick={() => setFormPass(null)}>
              Annuler
            </Bouton>
            <Bouton icone="save" enCours={enCours} onClick={enregistrerPass}>
              Enregistrer
            </Bouton>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {erreurForm && <Alerte ton="erreur">{erreurForm}</Alerte>}
          <ChampSelection libelle="Valable" value={pass.portee} onChange={(e) => setPass((x) => ({ ...x, portee: e.target.value as 'GLOBAL' | 'JOURNEE' }))} disabled={!!formPass?.edition}>
            <option value="GLOBAL">Pendant tout le programme</option>
            <option value="JOURNEE">Un jour précis</option>
          </ChampSelection>
          {pass.portee === 'JOURNEE' && (
            <ChampSelection libelle="Jour" value={pass.jour} onChange={(e) => setPass((x) => ({ ...x, jour: e.target.value }))}>
              {jours.map((j) => (
                <option key={j} value={j}>
                  {libelleJour(j)}
                </option>
              ))}
            </ChampSelection>
          )}
          <Champ libelle="Nom du pass" facultatif value={pass.titre} onChange={(e) => setPass((x) => ({ ...x, titre: e.target.value }))} aide="Sinon : « Pass complet » ou « Pass du … »" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ libelle={`Prix (${cadre.devise})`} type="number" min={0} value={pass.prix} onChange={(e) => setPass((x) => ({ ...x, prix: e.target.value }))} />
            <Champ libelle="Nombre de pass" type="number" min={1} value={pass.capacite} onChange={(e) => setPass((x) => ({ ...x, capacite: e.target.value }))} />
          </div>
        </div>
      </Modale>

      {/* ---- Duplication ---- */}
      <Modale
        ouverte={!!duplication}
        titre={duplication ? `Dupliquer le ${libelleJour(duplication.source)}` : ''}
        surFermeture={() => setDuplication(null)}
        pied={
          <>
            <Bouton variante="fantome" onClick={() => setDuplication(null)}>
              Annuler
            </Bouton>
            <Bouton icone="content_copy" enCours={enCours} onClick={dupliquer}>
              Dupliquer
            </Bouton>
          </>
        }
      >
        {duplication && (
          <div className="flex flex-col gap-3">
            {erreurForm && <Alerte ton="erreur">{erreurForm}</Alerte>}
            <p className="text-sm text-attenue">Les activités de ce jour sont recopiées aux mêmes horaires sur les jours choisis.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {jours
                .filter((j) => j !== duplication.source)
                .map((j) => (
                  <label key={j} className="flex cursor-pointer items-center gap-2 rounded-lg border border-black/10 p-2 text-sm capitalize">
                    <input
                      type="checkbox"
                      checked={duplication.cibles.includes(j)}
                      onChange={(e) => setDuplication({ ...duplication, cibles: e.target.checked ? [...duplication.cibles, j] : duplication.cibles.filter((x) => x !== j) })}
                    />
                    {libelleJour(j)}
                  </label>
                ))}
            </div>
            <button type="button" className="self-start text-sm font-semibold text-primaire underline" onClick={() => setDuplication({ ...duplication, cibles: jours.filter((j) => j !== duplication.source) })}>
              Tous les autres jours
            </button>
          </div>
        )}
      </Modale>
    </div>
  )
}
