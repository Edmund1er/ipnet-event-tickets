import { useRef, useState } from 'react'
import { messageErreur } from '../../../core/api/httpClient'
import { Bouton } from '../../../core/components/ui/Bouton'
import { Icone } from '../../../core/components/ui/Icone'
import { useImageProtegee } from '../../../core/hooks/useRequete'
import { adminEvenementService } from '../services/adminEvenementService'

interface Props {
  evenementId: number
  libelle: string
  /** Nom du fichier déjà envoyé, s'il y en a un. */
  nom?: string | null
  surChangement: (nom: string | null) => void
  /** Aperçu local d'une image qui vient d'être envoyée (la page enregistrée ne la référence pas encore). */
  apercus: Record<string, string>
  surApercu: (nom: string, url: string) => void
  aide?: string
}

/** Envoi d'une image de section : miniature, remplacer, retirer. L'image est envoyée tout de suite, la page l'utilisera à l'enregistrement. */
export function ChampImage({ evenementId, libelle, nom, surChangement, apercus, surApercu, aide }: Props) {
  const entree = useRef<HTMLInputElement>(null)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const distant = useImageProtegee(nom && !apercus[nom] ? `/admin/evenements/${evenementId}/page/images/${nom}` : null)
  const miniature = nom ? (apercus[nom] ?? distant.url) : null

  async function choisir(fichier: File | undefined) {
    if (!fichier) return
    setErreur(null)
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(fichier.type)) return setErreur('Formats acceptés : JPG, PNG ou WebP')
    if (fichier.size > 5 * 1024 * 1024) return setErreur('Image trop volumineuse (5 Mo maximum)')
    setEnCours(true)
    try {
      const envoye = await adminEvenementService.envoyerImagePage(evenementId, fichier)
      surApercu(envoye, URL.createObjectURL(fichier))
      surChangement(envoye)
    } catch (e) {
      setErreur(messageErreur(e))
    } finally {
      setEnCours(false)
      if (entree.current) entree.current.value = ''
    }
  }

  return (
    <div>
      <p className="etiquette">{libelle}</p>
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-300 bg-neutral-100">
          {miniature ? <img src={miniature} alt="" className="h-full w-full object-cover" /> : <Icone nom="image" className="text-neutral-400" />}
        </div>
        <div className="flex flex-wrap gap-2">
          <Bouton variante="secondaire" taille="petit" icone="upload" enCours={enCours} onClick={() => entree.current?.click()}>
            {nom ? 'Remplacer' : 'Ajouter une image'}
          </Bouton>
          {nom && (
            <Bouton variante="fantome" taille="petit" icone="delete" onClick={() => surChangement(null)}>
              Retirer
            </Bouton>
          )}
        </div>
        <input ref={entree} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => void choisir(e.target.files?.[0])} aria-label={libelle} />
      </div>
      {aide && !erreur && <p className="mt-1 text-xs text-attenue">{aide}</p>}
      {erreur && <p className="mt-1 text-xs font-semibold text-erreur">{erreur}</p>}
    </div>
  )
}
