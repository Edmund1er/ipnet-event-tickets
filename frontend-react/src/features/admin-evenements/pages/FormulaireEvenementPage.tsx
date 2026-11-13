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
import { useImageProtegee } from '../../../core/hooks/useRequete'
import { depuisChampDateHeure, versChampDateHeure } from '../../../core/utils/format'
import { adminEvenementService } from '../services/adminEvenementService'

const VIDE = { titre: '', description: '', dateDebut: '', lieu: '', prix: '', devise: 'XOF', capacite: '', dateLimiteReservation: '' }

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
        setF({
          titre: e.titre,
          description: e.description ?? '',
          dateDebut: versChampDateHeure(e.dateDebut),
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
    if (f.prix === '' || Number(f.prix) < 0) errs.prix = 'Prix positif ou nul'
    if (!f.capacite || Number(f.capacite) < 1 || !Number.isInteger(Number(f.capacite))) errs.capacite = 'Capacité entière ≥ 1'
    if (evt && Number(f.capacite) < evt.placesReservees) errs.capacite = `Au moins ${evt.placesReservees} (places déjà réservées)`
    if (!/^[A-Za-z]{3}$/.test(f.devise)) errs.devise = 'Code à 3 lettres'
    setErreurs(errs)
    if (Object.keys(errs).length) return

    const donnees = {
      titre: f.titre.trim(),
      description: f.description.trim(),
      dateDebut: depuisChampDateHeure(f.dateDebut),
      lieu: f.lieu.trim(),
      prix: Number(f.prix),
      devise: f.devise.toUpperCase(),
      capacite: Number(f.capacite),
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
        await adminEvenementService.modifier(evt.id, donnees)
        toast.succes('Événement modifié avec succès')
        navigate('/admin/evenements')
      } else {
        const cree = await adminEvenementService.creer(donnees)
        if (imageChoisie) {
          try {
            await adminEvenementService.envoyerImage(cree.id, imageChoisie)
          } catch (errImage) {
            toast.erreur(`Brouillon créé, mais l'image n'a pas été envoyée : ${messageErreur(errImage)}`)
          }
        }
        toast.succes('Événement créé avec succès')
        navigate('/admin/evenements')
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
            <Champ libelle="Titre" value={f.titre} onChange={maj('titre')} erreur={erreurs.titre} maxLength={200} />
            <ChampTexte libelle="Description" facultatif value={f.description} onChange={maj('description')} rows={6} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Champ libelle="Date et heure de début" type="datetime-local" min={minDateHeure} value={f.dateDebut} onChange={maj('dateDebut')} erreur={erreurs.dateDebut} />
              <Champ libelle="Date limite de réservation" type="datetime-local" facultatif min={minDateHeure} max={f.dateDebut || undefined} value={f.dateLimiteReservation} onChange={maj('dateLimiteReservation')} erreur={erreurs.dateLimiteReservation} aide="Par défaut, jusqu'au début de l'événement" />
            </div>
            <Champ libelle="Lieu" facultatif value={f.lieu} onChange={maj('lieu')} maxLength={255} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Champ libelle="Prix du billet" type="number" min={0} step="1" value={f.prix} onChange={maj('prix')} erreur={erreurs.prix} />
              <Champ libelle="Devise" value={f.devise} onChange={maj('devise')} erreur={erreurs.devise} maxLength={3} aide="XOF = FCFA" />
              <Champ libelle="Capacité" type="number" min={1} step="1" value={f.capacite} onChange={maj('capacite')} erreur={erreurs.capacite} />
            </div>
          </fieldset>
          {evt?.statut === 'PUBLIE' && (
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
      </div>
    </div>
  )
}
