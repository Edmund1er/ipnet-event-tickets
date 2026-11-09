import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { messageErreur } from '../../../core/api/httpClient'
import { Badge } from '../../../core/components/ui/Badge'
import { Bouton } from '../../../core/components/ui/Bouton'
import { ChampSelection } from '../../../core/components/ui/Champ'
import { ChargementPage } from '../../../core/components/ui/Chargement'
import { Alerte, EnteteSection, EtatVide } from '../../../core/components/ui/Divers'
import { Icone } from '../../../core/components/ui/Icone'
import { useToast } from '../../../core/components/ui/Toasts'
import { STATUTS_INSCRIPTION, type StatutInscription } from '../../../core/constants/statuts'
import { useRequete } from '../../../core/hooks/useRequete'
import { dateHeure, dateLongue } from '../../../core/utils/format'
import { adminEvenementService } from '../services/adminEvenementService'

/** EF-50 : participants par événement et statut de réservation ; EF-45 : export des présents. */
export function ParticipantsPage() {
  const { id } = useParams()
  const evt = useRequete(() => adminEvenementService.detail(Number(id)), [id])
  const participants = useRequete(() => adminEvenementService.participants(Number(id)), [id])
  const [filtre, setFiltre] = useState<StatutInscription | ''>('')
  const [recherche, setRecherche] = useState('')
  const [export_, setExport] = useState<'CSV' | 'PDF' | null>(null)
  const toast = useToast()

  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return (participants.donnees ?? []).filter(
      (p) =>
        (!filtre || p.statut === filtre) &&
        (!q || `${p.nom} ${p.prenom} ${p.email} ${p.telephone}`.toLowerCase().includes(q)),
    )
  }, [participants.donnees, filtre, recherche])

  async function exporter(format: 'CSV' | 'PDF') {
    setExport(format)
    try {
      await adminEvenementService.exporter(Number(id), format)
    } catch (e) {
      toast.erreur(messageErreur(e))
    } finally {
      setExport(null)
    }
  }

  if (evt.chargement || participants.chargement) return <ChargementPage />
  if (evt.erreur || participants.erreur) return <Alerte ton="erreur">{evt.erreur ?? participants.erreur}</Alerte>

  const compte = (s: StatutInscription) => (participants.donnees ?? []).filter((p) => p.statut === s).length

  return (
    <div>
      <Link to="/admin/evenements" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primaire hover:underline">
        <Icone nom="arrow_back" taille={18} /> Événements
      </Link>
      <EnteteSection
        icone="group"
        titre="Participants"
        sousTitre={evt.donnees ? `${evt.donnees.titre} — ${dateLongue(evt.donnees.dateDebut)}` : ''}
        actions={
          <>
            <Bouton variante="secondaire" icone="table_view" enCours={export_ === 'CSV'} onClick={() => exporter('CSV')}>
              Présents CSV
            </Bouton>
            <Bouton variante="secondaire" icone="picture_as_pdf" enCours={export_ === 'PDF'} onClick={() => exporter('PDF')}>
              Présents PDF
            </Bouton>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(['CONFIRMEE', 'PREUVE_ENVOYEE', 'EN_ATTENTE_PAIEMENT', 'REJETEE'] as StatutInscription[]).map((s) => (
          <div key={s} className="carte p-4">
            <p className="titre-section">{STATUTS_INSCRIPTION[s].libelle}</p>
            <p className="chiffres mt-1 font-titre text-2xl font-bold">{compte(s)}</p>
          </div>
        ))}
      </div>

      <div className="carte mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="q" className="etiquette">
            Rechercher
          </label>
          <input id="q" className="champ" placeholder="Nom, e-mail ou téléphone" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
        </div>
        <ChampSelection libelle="Statut" className="sm:w-60" value={filtre} onChange={(e) => setFiltre(e.target.value as StatutInscription | '')}>
          <option value="">Tous</option>
          {Object.entries(STATUTS_INSCRIPTION).map(([k, v]) => (
            <option key={k} value={k}>
              {v.libelle}
            </option>
          ))}
        </ChampSelection>
      </div>

      {liste.length === 0 ? (
        <EtatVide icone="person_off" titre="Aucun participant" />
      ) : (
        <div className="carte overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-bordure bg-surface text-left">
                {['Participant', 'Type', 'Contact', 'Réservé le', 'Statut'].map((h) => (
                  <th key={h} scope="col" className="titre-section px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {liste.map((p) => (
                <tr key={p.inscriptionId} className="border-b border-bordure last:border-0">
                  <td className="px-4 py-3 font-semibold">
                    {p.nom} {p.prenom}
                  </td>
                  <td className="px-4 py-3">{p.typeProfil === 'ETUDIANT' ? 'Étudiant' : 'Visiteur'}</td>
                  <td className="px-4 py-3">
                    <span className="block">{p.email}</span>
                    <span className="text-xs text-attenue">{p.telephone}</span>
                  </td>
                  <td className="chiffres px-4 py-3">{dateHeure(p.reserveLe)}</td>
                  <td className="px-4 py-3">
                    <Badge ton={STATUTS_INSCRIPTION[p.statut].ton}>{STATUTS_INSCRIPTION[p.statut].libelle}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
