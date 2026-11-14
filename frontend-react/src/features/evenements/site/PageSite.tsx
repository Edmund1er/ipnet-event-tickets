import { useEffect, useMemo, useRef, useState } from 'react'
import type { Evenement } from '../../../core/api/types'
import { Chargement } from '../../../core/components/ui/Chargement'
import { Alerte } from '../../../core/components/ui/Divers'
import { construireContenu } from './contenu'
import { genererPage } from './moteur'
import type { CleModele, PageConfig } from './types'

interface Props {
  evenement: Evenement
  /** Activités et pass d'un programme multi-jours. */
  elements: Evenement[]
  config: PageConfig
  modele: CleModele
  /** Bouton « Réserver » (menu, bannière, pied de page…). */
  surReserver: () => void
  /** Clic sur une activité ou un pass du programme. */
  surOuvrir: (id: number) => void
  /** Adresse d'une image de section (par défaut : image publique de la page). */
  urlImage?: (nom: string) => string
}

/**
 * Affiche la page d'un événement : le template choisi, rempli avec ses données, dans un cadre qui occupe tout l'espace
 * à côté du menu latéral (la page se comporte comme un site à part, l'application reste active autour).
 */
export function PageSite({ evenement, elements, config, modele, surReserver, surOuvrir, urlImage }: Props) {
  const cadre = useRef<HTMLIFrameElement>(null)
  const [html, setHtml] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  const cleContenu = JSON.stringify([evenement, elements, config, modele])
  const resoudre = useMemo(() => urlImage ?? ((nom: string) => `${window.location.origin}/api/evenements/${evenement.id}/page/images/${nom}`), [urlImage, evenement.id])

  useEffect(() => {
    let annule = false
    setErreur(null)
    const contenu = construireContenu(evenement, elements, config, resoudre)
    // Les chemins d'image relatifs à l'API deviennent absolus : le cadre n'a pas la même base d'adresse
    if (contenu.imageHero?.startsWith('/')) contenu.imageHero = window.location.origin + contenu.imageHero
    genererPage(modele, contenu)
      .then((h) => !annule && setHtml(h))
      .catch((e) => !annule && setErreur(e instanceof Error ? e.message : 'Page indisponible'))
    return () => {
      annule = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleContenu])

  useEffect(() => {
    function recu(e: MessageEvent) {
      if (e.source !== cadre.current?.contentWindow || e.data?.source !== 'ipnet') return
      if (e.data.type === 'reserver') surReserver()
      if (e.data.type === 'ouvrir' && typeof e.data.id === 'number') surOuvrir(e.data.id)
    }
    window.addEventListener('message', recu)
    return () => window.removeEventListener('message', recu)
  }, [surReserver, surOuvrir])

  if (erreur) return <Alerte ton="erreur">{erreur}</Alerte>
  if (!html)
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Chargement />
      </div>
    )
  return (
    <iframe
      ref={cadre}
      title={evenement.titre}
      srcDoc={html}
      sandbox="allow-scripts allow-same-origin allow-popups"
      className="block h-full w-full border-0 bg-white"
    />
  )
}
