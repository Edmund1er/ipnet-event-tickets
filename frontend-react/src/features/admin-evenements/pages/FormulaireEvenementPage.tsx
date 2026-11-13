import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { messageErreur, versErreurApi } from '../../../core/api/httpClient'
import type { Evenement } from '../../../core/api/types'
import { Bouton } from '../../../core/components/ui/Bouton'
import { Champ, ChampTexte } from '../../../core/components/ui/Champ'
import { ChargementPage } from '../../../core/components/ui/Chargement'
import { Alerte, EnteteSection } from '../../../core/components/ui/Divers'
import { Icone } from '../../../core/components/ui/Icone'
import { useToast } from '../../../core/components/ui/Toasts'
import { AMBIANCES, CLES_AMBIANCE, COULEUR_DEFAUT, ambianceDe, themeEvenement, type CleAmbiance } from '../../evenements/theme/ambiances'
import { useImageProtegee } from '../../../core/hooks/useRequete'
import { depuisChampDateHeure, versChampDateHeure } from '../../../core/utils/format'
import { adminEvenementService } from '../services/adminEvenementService'

const VIDE = { titre: '', description: '', dateDebut: '', dateFin: '', lieu: '', prix: '', devise: 'XOF', capacite: '', dateLimiteReservation: '' }

export function FormulaireEvenementPage() {
  const { id } = useParams()
  const edition = !!id
  const navigate = useNavigate()
  const toast = useToast()
  const [evt, setEvt] = useState<Evenement | null>(null)
  const [f, setF] = useState(VIDE)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreur, setErreur] = useState<string | null>(null)
  const [chargement, setChargement] = useState(edition)
  const [enCours, setEnCours] = useState(false)
  // Programme multi-jours (semaine culturelle…) ou événement simple : choisi à la création, figé ensuite
  const [programme, setProgramme] = useState(false)
  const [ambiance, setAmbiance] = useState<CleAmbiance>('SOBRE')
  const [couleur, setCouleur] = useState<string | null>(null)
  const [imageEnCours, setImageEnCours] = useState(false)
  const [versionImage, setVersionImage] = useState(0)
  // Création : l'image est choisie tout de suite, envoyée juste après la création du brouillon
  const [imageChoisie, setImageChoisie] = useState<File | null>(null)
  const apercu = useMemo(() => (imageChoisie ? URL.createObjectURL(imageChoisie) : null), [imageChoisie])
  useEffect(() => () => { if (apercu) URL.revokeObjectURL(apercu) }, [apercu])
  const minDateHeure = useMemo(() => versChampDateHeure(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString()), [])
  const image = useImageProtegee(evt?.aImage ? `${adminEvenementService.cheminImage(evt.id)}?v=${versionImage}` : null)

  useEffect(() => {
    if (!id) return
    adminEvenementService
      .detail(Number(id))
      .then((e) => {
        setEvt(e)
        setProgramme(e.type === 'CADRE')
        setAmbiance((e.ambiance as CleAmbiance) ?? 'SOBRE')
        setCouleur(e.couleurPrincipale ?? null)
        setF({
          titre: e.titre,
          description: e.description ?? '',
          dateDebut: versChampDateHeure(e.dateDebut),
          dateFin: versChampDateHeure(e.dateFin),
          lieu: e.lieu ?? '',
          prix: String(e.prix),
          devise: e.devise,
          capacite: String(e.capacite),
          dateLimiteReservation: e.dateLimiteReservation ? versChampDateHeure(e.dateLimiteReservation) : '',
        })
      })
      .catch((e) => setErreur(messageErreur(e)))
      .finally(() => setChargement(false))
  }, [id])

  const maj = (cle: keyof typeof f) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [cle]: e.target.value }))

  async function enregistrer(e: FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!f.titre.trim()) errs.titre = 'Titre obligatoire'
    if (!f.dateDebut) errs.dateDebut = 'Date et heure obligatoires'
    else if (new Date(f.dateDebut).getTime() <= Date.now()) errs.dateDebut = 'La date doit être dans le futur'
    if (f.dateLimiteReservation && f.dateDebut && new Date(f.dateLimiteReservation).getTime() > new Date(f.dateDebut).getTime()) {
      errs.dateLimiteReservation = 'La date limite ne peut pas dépasser le début de l’événement'
    }
    if (programme) {
      if (!f.dateFin) errs.dateFin = 'Date de fin obligatoire'
      else if (f.dateDebut && new Date(f.dateFin).getTime() < new Date(f.dateDebut).getTime()) errs.dateFin = 'La fin doit suivre le début'
    } else {
      if (f.prix === '' || Number(f.prix) < 0) errs.prix = 'Prix positif ou nul'
      if (!f.capacite || Number(f.capacite) < 1 || !Number.isInteger(Number(f.capacite))) errs.capacite = 'Capacité entière ≥ 1'
    }
    if (!programme && evt && Number(f.capacite) < evt.placesReservees) errs.capacite = `Au moins ${evt.placesReservees} (places déjà réservées)`
    if (!/^[A-Za-z]{3}$/.test(f.devise)) errs.devise = 'Code à 3 lettres'
    setErreurs(errs)
    if (Object.keys(errs).length) return

    const donnees = {
      titre: f.titre.trim(),
      description: f.description.trim(),
      dateDebut: depuisChampDateHeure(f.dateDebut),
      lieu: f.lieu.trim(),
      prix: programme ? 0 : Number(f.prix),
      devise: f.devise.toUpperCase(),
      capacite: programme ? 1 : Number(f.capacite),
      dateFin: programme && f.dateFin ? depuisChampDateHeure(f.dateFin) : null,
      type: programme ? ('CADRE' as const) : ('EVENEMENT' as const),
      dateLimiteReservation: f.dateLimiteReservation ? depuisChampDateHeure(f.dateLimiteReservation) : null,
    }
    setErreur(null)
    setEnCours(true)
    try {
      if (edition && evt) {
        if (imageChoisie) {
          try {
            await adminEvenementService.envoyerImage(evt.id, imageChoisie)
          } catch (errImage) {
            toast.erreur(`Image non enregistrée : ${messageErreur(errImage)}`)
          }
        }
        await adminEvenementService.definirApparence(evt.id, ambiance, couleur)
        await adminEvenementService.modifier(evt.id, donnees)
        toast.succes('Événement modifié avec succès')
        navigate('/admin/evenements')
      } else {
        const cree = await adminEvenementService.creer(donnees)
        try {
          await adminEvenementService.definirApparence(cree.id, ambiance, couleur)
        } catch (errApp) {
          toast.erreur(`Brouillon créé, mais l'apparence n'a pas été enregistrée : ${messageErreur(errApp)}`)
        }
        if (imageChoisie) {
          try {
            await adminEvenementService.envoyerImage(cree.id, imageChoisie)
          } catch (errImage) {
            toast.erreur(`Brouillon créé, mais l'image n'a pas été envoyée : ${messageErreur(errImage)}`)
          }
        }
        toast.succes(programme ? 'Programme créé : ajoutez maintenant ses activités' : 'Événement créé avec succès')
        navigate(programme ? `/admin/evenements/${cree.id}/programme` : '/admin/evenements')
      }
    } catch (err) {
      const api = versErreurApi(err)
      if (api.champs) setErreurs(api.champs)
      setErreur(api.message)
    } finally {
      setEnCours(false)
    }
  }

  async function envoyerImage(e: ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0]
    e.target.value = ''
    if (!fichier) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(fichier.type)) {
      toast.erreur('Format accepté : JPG, PNG ou WebP')
      return
    }
    if (fichier.size > 5 * 1024 * 1024) {
      toast.erreur('Image trop volumineuse (5 Mo maximum)')
      return
    }
    if (!evt) {
      setImageChoisie(fichier)
      return
    }
    setImageEnCours(true)
    try {
      setEvt(await adminEvenementService.envoyerImage(evt.id, fichier))
      setVersionImage((v) => v + 1)
      toast.succes('Image mise à jour')
    } catch (err) {
      toast.erreur(messageErreur(err))
    } finally {
      setImageEnCours(false)
    }
  }

  async function retirerImage() {
    if (!evt) return
    setImageEnCours(true)
    try {
      setEvt(await adminEvenementService.supprimerImage(evt.id))
      toast.succes('Image retirée')
    } catch (err) {
      toast.erreur(messageErreur(err))
    } finally {
      setImageEnCours(false)
    }
  }

  if (chargement) return <ChargementPage />
  const verrouille = evt && (evt.statut === 'ANNULE' || evt.statut === 'TERMINE')

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/admin/evenements" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primaire hover:underline">
        <Icone nom="arrow_back" taille={18} /> Événements
      </Link>
      <EnteteSection icone={edition ? 'edit_calendar' : 'add_circle'} titre={edition ? "Modifier l'événement" : 'Nouvel événement'} />

      {erreur && (
        <div className="mb-4">
          <Alerte ton="erreur">{erreur}</Alerte>
        </div>
      )}
      {verrouille && (
        <div className="mb-4">
          <Alerte ton="attention">Cet événement est {evt.statut === 'ANNULE' ? 'annulé' : 'terminé'} : il ne peut plus être modifié.</Alerte>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <form onSubmit={enregistrer} noValidate className="carte flex flex-col gap-4 p-5">
          <fieldset disabled={!!verrouille || enCours} className="flex flex-col gap-4">
            {!edition && (
              <div role="radiogroup" aria-label="Type d'événement" className="grid gap-2 sm:grid-cols-2">
                {[
                  { v: false, titre: 'Événement simple', texte: 'Une soirée, une conférence : une date, un billet.', icone: 'confirmation_number' },
                  { v: true, titre: 'Programme sur plusieurs jours', texte: 'Semaine culturelle, festival : plusieurs activités, des pass.', icone: 'calendar_view_week' },
                ].map((o) => (
                  <button
                    key={o.titre}
                    type="button"
                    role="radio"
                    aria-checked={programme === o.v}
                    onClick={() => setProgramme(o.v)}
                    className={`flex items-start gap-3 rounded-lg border-2 p-3 text-left ${programme === o.v ? 'border-primaire bg-primaire-clair' : 'border-black/10'}`}
                  >
                    <Icone nom={o.icone} className="text-primaire" />
                    <span>
                      <span className="block font-semibold">{o.titre}</span>
                      <span className="block text-xs text-attenue">{o.texte}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            <Champ libelle="Titre" value={f.titre} onChange={maj('titre')} erreur={erreurs.titre} maxLength={200} />
            <ChampTexte libelle="Description" facultatif value={f.description} onChange={maj('description')} rows={6} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Champ libelle={programme ? 'Début du programme' : 'Date et heure de début'} type="datetime-local" min={minDateHeure} value={f.dateDebut} onChange={maj('dateDebut')} erreur={erreurs.dateDebut} />
              {programme ? (
                <Champ libelle="Fin du programme" type="datetime-local" min={f.dateDebut || minDateHeure} value={f.dateFin} onChange={maj('dateFin')} erreur={erreurs.dateFin} />
              ) : (
                <Champ libelle="Date limite de réservation" type="datetime-local" facultatif min={minDateHeure} max={f.dateDebut || undefined} value={f.dateLimiteReservation} onChange={maj('dateLimiteReservation')} erreur={erreurs.dateLimiteReservation} aide="Par défaut, jusqu'au début de l'événement" />
              )}
            </div>
            <Champ libelle="Lieu" facultatif value={f.lieu} onChange={maj('lieu')} maxLength={255} />
            {programme ? (
              <Champ libelle="Devise" value={f.devise} onChange={maj('devise')} erreur={erreurs.devise} maxLength={3} aide="XOF = FCFA. Prix et places se règlent activité par activité." />
            ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <Champ libelle="Prix du billet" type="number" min={0} step="1" value={f.prix} onChange={maj('prix')} erreur={erreurs.prix} />
              <Champ libelle="Devise" value={f.devise} onChange={maj('devise')} erreur={erreurs.devise} maxLength={3} aide="XOF = FCFA" />
              <Champ libelle="Capacité" type="number" min={1} step="1" value={f.capacite} onChange={maj('capacite')} erreur={erreurs.capacite} />
            </div>
            )}
          </fieldset>
          {evt && programme && (
            <Link to={`/admin/evenements/${evt.id}/programme`} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border-[1.5px] border-primaire font-semibold text-primaire hover:bg-primaire-clair">
              <Icone nom="calendar_view_week" taille={20} /> Gérer les activités et les pass
            </Link>
          )}
          {evt?.statut === 'PUBLIE' && !programme && (
            <Alerte ton="info">
              {evt.placesReservees > 0
                ? "Des réservations sont déjà enregistrées : seuls le nombre de places (capacité) et la date limite peuvent encore être ajustés."
                : "Toutes les informations sont modifiables tant qu'aucune réservation n'a été effectuée."}
            </Alerte>
          )}
          {!verrouille && (
            <div className="flex justify-end">
              <Bouton type="submit" icone="save" enCours={enCours}>
                {edition ? 'Enregistrer' : 'Créer le brouillon'}
              </Bouton>
            </div>
          )}
        </form>

        <div className="flex flex-col gap-5">
        <aside className="carte flex flex-col gap-3 p-5">
          <h2 className="text-lg font-semibold">Image</h2>
          {!evt ? (
            <>
              <div className="flex aspect-[16/9] items-center justify-center overflow-hidden rounded-lg bg-surface">
                {apercu ? <img src={apercu} alt="Aperçu de l'image choisie" className="h-full w-full object-cover" /> : <Icone nom="image" taille={48} className="text-attenue" />}
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-lg border-[1.5px] border-primaire px-3 text-sm font-semibold text-primaire hover:bg-primaire-clair">
                  <Icone nom="upload" taille={18} /> {imageChoisie ? 'Changer' : 'Choisir une image'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={envoyerImage} />
                </label>
                {imageChoisie && (
                  <Bouton variante="fantome" taille="petit" icone="delete" onClick={() => setImageChoisie(null)}>
                    Retirer
                  </Bouton>
                )}
              </div>
              <p className="text-xs text-attenue">Facultative. JPG, PNG ou WebP — 5 Mo maximum. Envoyée à la création du brouillon.</p>
            </>
          ) : (
            <>
              <div className="flex aspect-[16/9] items-center justify-center overflow-hidden rounded-lg bg-surface">
                {evt.aImage && image.url ? (
                  <img src={image.url} alt="Image de l'événement" className="h-full w-full object-cover" />
                ) : (
                  <Icone nom="image" taille={48} className="text-attenue" />
                )}
              </div>
              {!verrouille && (
                <div className="flex flex-wrap gap-2">
                  <label className={`inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-lg border-[1.5px] border-primaire px-3 text-sm font-semibold text-primaire hover:bg-primaire-clair ${imageEnCours ? 'pointer-events-none opacity-50' : ''}`}>
                    <Icone nom="upload" taille={18} /> {evt.aImage ? 'Remplacer' : 'Ajouter'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={envoyerImage} />
                  </label>
                  {evt.aImage && (
                    <Bouton variante="fantome" taille="petit" icone="delete" enCours={imageEnCours} onClick={retirerImage}>
                      Retirer
                    </Bouton>
                  )}
                </div>
              )}
              <p className="text-xs text-attenue">JPG, PNG ou WebP — 5 Mo maximum.</p>
            </>
          )}
        </aside>

        <section className="carte flex flex-col gap-3 p-5" aria-label="Apparence de la page">
          <h2 className="text-lg font-semibold">Ambiance</h2>
          <div className="grid grid-cols-2 gap-2">
            {CLES_AMBIANCE.map((cle) => (
              <button
                key={cle}
                type="button"
                disabled={!!verrouille}
                onClick={() => setAmbiance(cle)}
                aria-pressed={ambiance === cle}
                className={`h-16 rounded-lg border-2 text-sm font-bold ${ambiance === cle ? 'border-primaire' : 'border-transparent'}`}
                style={{
                  ...themeEvenement(cle, couleur),
                  backgroundImage: 'var(--ev-motif), linear-gradient(135deg, var(--ev-primaire), var(--ev-fonce))',
                  color: 'var(--ev-sur-primaire)',
                }}
              >
                {AMBIANCES[cle].libelle}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-3 text-sm font-semibold">
            Couleur
            <input
              type="color"
              disabled={!!verrouille}
              value={couleur ?? ambianceDe(ambiance).couleur ?? COULEUR_DEFAUT}
              onChange={(e) => setCouleur(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border"
            />
            {couleur && (
              <button type="button" className="text-xs font-semibold text-primaire underline" onClick={() => setCouleur(null)}>
                Couleur de l'ambiance
              </button>
            )}
          </label>
          <p className="text-xs text-attenue">Sans photo, le fond est généré automatiquement. Le texte reste lisible quelle que soit la couleur.</p>
        </section>
        </div>
      </div>
    </div>
  )
}
