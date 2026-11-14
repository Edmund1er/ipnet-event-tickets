import { Link, useParams } from 'react-router-dom'
import { useImmersion } from '../../../core/components/layout/Immersion'
import { COULEURS_MODELE } from '../site/immersion'
import { PageSite } from '../site/PageSite'
import { evenementExemple, pageExemple } from '../site/exemple'
import { MODELES, PAGE_VIDE, modeleDe } from '../site/types'

const evenement = evenementExemple()
const page = pageExemple()

/** Aperçu d'un modèle avec un contenu d'exemple (ou la page de base avec ?vide=1). Aucune donnée réelle n'est utilisée. */
export function ApercuModelePage() {
  const { cle } = useParams()
  const modele = modeleDe(cle?.toUpperCase()) ?? MODELES[0]
  const vide = new URLSearchParams(window.location.search).has('vide')
  useImmersion({ ...COULEURS_MODELE[modele.cle], retour: { libelle: 'Événements', vers: '/' } })
  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-[420px] flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-black/10 bg-white px-4 py-2 text-sm">
        <span className="font-semibold">Aperçu du modèle :</span>
        {MODELES.map((m) => (
          <Link key={m.cle} to={`/apercu-modele/${m.cle.toLowerCase()}${vide ? '?vide=1' : ''}`} className={`rounded-full px-3 py-1 font-semibold ${m.cle === modele.cle ? 'bg-neutral-800 text-white' : 'bg-neutral-100 hover:bg-neutral-200'}`}>
            {m.nom}
          </Link>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        <PageSite evenement={evenement} elements={[]} config={vide ? PAGE_VIDE : page} modele={modele.cle} surReserver={() => undefined} surOuvrir={() => undefined} />
      </div>
    </div>
  )
}
