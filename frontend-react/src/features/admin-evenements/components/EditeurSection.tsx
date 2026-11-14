import { useState } from 'react'
import { Bouton } from '../../../core/components/ui/Bouton'
import { Champ, ChampTexte } from '../../../core/components/ui/Champ'
import { Icone } from '../../../core/components/ui/Icone'
import type { CreneauConfig, IntervenantConfig, SectionConfig, TypeSection } from '../../evenements/site/types'
import { ChampImage } from './ChampImage'

export const TYPES_SECTION: Record<TypeSection, { libelle: string; icone: string; aide: string }> = {
  HERO: { libelle: 'Bannière', icone: 'panorama', aide: 'Grande image en haut de page, titre et bouton.' },
  A_PROPOS: { libelle: 'À propos', icone: 'article', aide: 'Présentation de l’événement, avec une image.' },
  INTERVENANTS: { libelle: 'Intervenants', icone: 'groups', aide: 'Artistes, orateurs, invités : nom, rôle, photo.' },
  PROGRAMME: { libelle: 'Programme', icone: 'schedule', aide: 'Horaires jour par jour.' },
  LIEU: { libelle: 'Lieu', icone: 'location_on', aide: 'Adresse, plan, téléphone, e-mail.' },
  TEXTE: { libelle: 'Texte libre', icone: 'notes', aide: 'Un paragraphe avec un titre et, si vous voulez, une image.' },
}

interface Props {
  evenementId: number
  section: SectionConfig
  surChangement: (s: SectionConfig) => void
  apercus: Record<string, string>
  surApercu: (nom: string, url: string) => void
  /** Pour un programme multi-jours : les activités créées dans « Programme » s'ajoutent d'elles-mêmes. */
  estProgramme: boolean
}

const jourLisible = (j: string) => new Date(`${j}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

/** Champs d'une section, selon son type. Tout est facultatif : un champ vide laisse la page de base faire son travail. */
export function EditeurSection({ evenementId, section: s, surChangement, apercus, surApercu, estProgramme }: Props) {
  const maj = (p: Partial<SectionConfig>) => surChangement({ ...s, ...p })
  const image = (libelle: string, aide?: string) => (
    <ChampImage evenementId={evenementId} libelle={libelle} nom={s.image} surChangement={(nom) => maj({ image: nom })} apercus={apercus} surApercu={surApercu} aide={aide} />
  )

  return (
    <div className="flex flex-col gap-4">
      <Champ libelle="Titre" facultatif value={s.titre ?? ''} onChange={(e) => maj({ titre: e.target.value })} maxLength={150} />

      {s.type === 'HERO' && (
        <>
          <Champ libelle="Sous-titre" facultatif value={s.sousTitre ?? ''} onChange={(e) => maj({ sousTitre: e.target.value })} maxLength={300} />
          <Champ libelle="Texte du bouton" facultatif value={s.bouton ?? ''} onChange={(e) => maj({ bouton: e.target.value })} maxLength={40} aide="Par défaut : « Réserver ma place »" />
          {image('Image de fond', 'Affichée derrière le titre, en haut de la page.')}
        </>
      )}

      {s.type === 'A_PROPOS' && (
        <>
          <ChampTexte libelle="Texte" rows={6} value={s.texte ?? ''} onChange={(e) => maj({ texte: e.target.value })} maxLength={5000} />
          <Champ libelle="Texte du bouton" facultatif value={s.bouton ?? ''} onChange={(e) => maj({ bouton: e.target.value })} maxLength={40} />
          {image('Image', 'Sans image, le texte occupe toute la largeur.')}
        </>
      )}

      {s.type === 'TEXTE' && (
        <>
          <ChampTexte libelle="Texte" rows={6} value={s.texte ?? ''} onChange={(e) => maj({ texte: e.target.value })} maxLength={5000} />
          {image('Image')}
        </>
      )}

      {s.type === 'LIEU' && (
        <>
          <Champ libelle="Adresse" value={s.adresse ?? ''} onChange={(e) => maj({ adresse: e.target.value })} maxLength={300} aide="Le plan s'affiche à partir de cette adresse." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ libelle="Téléphone" facultatif value={s.telephone ?? ''} onChange={(e) => maj({ telephone: e.target.value })} maxLength={40} />
            <Champ libelle="E-mail" facultatif type="email" value={s.email ?? ''} onChange={(e) => maj({ email: e.target.value })} maxLength={120} />
          </div>
          <ChampTexte libelle="Précisions d'accès" facultatif rows={3} value={s.texte ?? ''} onChange={(e) => maj({ texte: e.target.value })} maxLength={5000} />
        </>
      )}

      {s.type === 'INTERVENANTS' && <ListeIntervenants {...{ evenementId, apercus, surApercu }} liste={s.intervenants ?? []} surChangement={(l) => maj({ intervenants: l })} />}
      {s.type === 'PROGRAMME' && <EditeurProgramme creneaux={s.creneaux ?? []} surChangement={(c) => maj({ creneaux: c })} estProgramme={estProgramme} />}
    </div>
  )
}

function ListeIntervenants({
  evenementId,
  liste,
  surChangement,
  apercus,
  surApercu,
}: {
  evenementId: number
  liste: IntervenantConfig[]
  surChangement: (l: IntervenantConfig[]) => void
  apercus: Record<string, string>
  surApercu: (nom: string, url: string) => void
}) {
  const maj = (i: number, p: Partial<IntervenantConfig>) => surChangement(liste.map((x, k) => (k === i ? { ...x, ...p } : x)))
  return (
    <div className="flex flex-col gap-3">
      <p className="etiquette">Intervenants</p>
      {liste.length === 0 && <p className="text-sm text-attenue">Aucun intervenant. Ajoutez les artistes, orateurs ou invités.</p>}
      {liste.map((p, i) => (
        <div key={i} className="grid gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 sm:grid-cols-[1fr_1fr_auto]">
          <div className="flex flex-col gap-3 sm:col-span-2 sm:grid sm:grid-cols-2">
            <Champ libelle="Nom" value={p.nom} onChange={(e) => maj(i, { nom: e.target.value })} maxLength={100} />
            <Champ libelle="Rôle" facultatif value={p.role ?? ''} onChange={(e) => maj(i, { role: e.target.value })} maxLength={100} />
            <div className="sm:col-span-2">
              <ChampImage evenementId={evenementId} libelle="Photo" nom={p.photo} surChangement={(nom) => maj(i, { photo: nom })} apercus={apercus} surApercu={surApercu} aide="Sans photo, les initiales s'affichent." />
            </div>
          </div>
          <Bouton variante="fantome" taille="petit" icone="delete" aria-label={`Retirer ${p.nom || 'cet intervenant'}`} onClick={() => surChangement(liste.filter((_, k) => k !== i))} />
        </div>
      ))}
      <div>
        <Bouton variante="secondaire" taille="petit" icone="person_add" onClick={() => surChangement([...liste, { nom: '', role: '', photo: null }])}>
          Ajouter un intervenant
        </Bouton>
      </div>
    </div>
  )
}

/** Programme jour par jour : on ajoute un jour, puis ses créneaux. */
function EditeurProgramme({ creneaux, surChangement, estProgramme }: { creneaux: CreneauConfig[]; surChangement: (c: CreneauConfig[]) => void; estProgramme: boolean }) {
  const [joursVides, setJoursVides] = useState<string[]>([])
  const [nouveau, setNouveau] = useState('')
  const jours = [...new Set([...creneaux.map((c) => c.jour), ...joursVides])].sort()
  const maj = (cible: CreneauConfig, p: Partial<CreneauConfig>) => surChangement(creneaux.map((c) => (c === cible ? { ...c, ...p } : c)))

  return (
    <div className="flex flex-col gap-4">
      {estProgramme && (
        <div className="flex gap-2 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900">
          <Icone nom="info" taille={20} />
          <p>Les activités créées dans la page « Programme » s’affichent automatiquement ici. Ajoutez seulement les créneaux supplémentaires (pauses, accueil…).</p>
        </div>
      )}
      {jours.length === 0 && <p className="text-sm text-attenue">Aucun jour. Choisissez une date ci-dessous pour commencer.</p>}
      {jours.map((j) => {
        const lignes = creneaux.filter((c) => c.jour === j)
        return (
          <section key={j} className="rounded-xl border border-neutral-200">
            <header className="flex items-center justify-between rounded-t-xl bg-neutral-800 px-4 py-2 text-white">
              <h4 className="font-bold capitalize">{jourLisible(j)}</h4>
              <button
                type="button"
                className="text-xs font-semibold underline"
                onClick={() => {
                  surChangement(creneaux.filter((c) => c.jour !== j))
                  setJoursVides((v) => v.filter((x) => x !== j))
                }}
              >
                Retirer ce jour
              </button>
            </header>
            <div className="flex flex-col divide-y divide-neutral-200">
              {lignes.map((c, i) => (
                <div key={i} className="grid gap-3 p-3 sm:grid-cols-[110px_110px_1fr_auto]">
                  <Champ libelle="Début" type="time" value={c.debut} onChange={(e) => maj(c, { debut: e.target.value })} />
                  <Champ libelle="Fin" facultatif type="time" value={c.fin ?? ''} onChange={(e) => maj(c, { fin: e.target.value })} />
                  <Champ libelle="Titre" value={c.titre} onChange={(e) => maj(c, { titre: e.target.value })} maxLength={150} />
                  <Bouton variante="fantome" taille="petit" icone="delete" aria-label="Retirer ce créneau" className="self-end" onClick={() => surChangement(creneaux.filter((x) => x !== c))} />
                  <Champ className="sm:col-span-2" libelle="Intervenant" facultatif value={c.intervenant ?? ''} onChange={(e) => maj(c, { intervenant: e.target.value })} maxLength={100} />
                  <Champ className="sm:col-span-2" libelle="Lieu" facultatif value={c.lieu ?? ''} onChange={(e) => maj(c, { lieu: e.target.value })} maxLength={120} />
                </div>
              ))}
            </div>
            <div className="p-3">
              <Bouton variante="secondaire" taille="petit" icone="add" onClick={() => surChangement([...creneaux, { jour: j, debut: lignes.at(-1)?.fin || lignes.at(-1)?.debut || '09:00', fin: '', titre: '' }])}>
                Ajouter un créneau
              </Bouton>
            </div>
          </section>
        )
      })}
      <div className="flex flex-wrap items-end gap-3">
        <Champ libelle="Ajouter un jour" type="date" value={nouveau} onChange={(e) => setNouveau(e.target.value)} />
        <Bouton
          variante="primaire"
          taille="petit"
          icone="event"
          disabled={!nouveau || jours.includes(nouveau)}
          onClick={() => {
            surChangement([...creneaux, { jour: nouveau, debut: '09:00', fin: '', titre: '' }])
            setNouveau('')
          }}
        >
          Ajouter ce jour
        </Bouton>
      </div>
    </div>
  )
}
