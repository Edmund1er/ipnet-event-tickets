import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { messageErreur } from '../../../core/api/httpClient'
import { Badge } from '../../../core/components/ui/Badge'
import { Bouton } from '../../../core/components/ui/Bouton'
import { ChampTexte } from '../../../core/components/ui/Champ'
import { Chargement, ChargementPage } from '../../../core/components/ui/Chargement'
import { Alerte, EnteteSection, EtatVide, Modale, Pagination } from '../../../core/components/ui/Divers'
import { Icone } from '../../../core/components/ui/Icone'
import { useToast } from '../../../core/components/ui/Toasts'
import { STATUTS_PAIEMENT, type StatutPaiement } from '../../../core/constants/statuts'
import { useRequete } from '../../../core/hooks/useRequete'
import { dateHeure, montant } from '../../../core/utils/format'
import { adminPaiementService, type PaiementAdmin } from '../services/adminPaiementService'

const ONGLETS: StatutPaiement[] = ['EN_ATTENTE', 'VALIDE', 'REJETE', 'A_REMBOURSER', 'REMBOURSE']

/** EF-22 : file des preuves non rapprochées automatiquement, validation ou rejet motivé. RG-19 : remboursements. */
export function PaiementsPage() {
  const [statut, setStatut] = useState<StatutPaiement>('EN_ATTENTE')
  const [page, setPage] = useState(0)
  const { donnees, chargement, erreur, recharger } = useRequete(() => adminPaiementService.lister(statut, page), [statut, page])
  const [selection, setSelection] = useState<PaiementAdmin | null>(null)

  return (
    <div>
      <EnteteSection
        icone="payments"
        titre="Paiements"
        sousTitre="Références Mobile Money à vérifier"
        actions={
          <Link to="/admin/releve" className="inline-flex h-11 items-center gap-2 rounded-lg border-[1.5px] border-primaire px-4 font-semibold text-primaire hover:bg-primaire-clair">
            <Icone nom="upload_file" /> Importer un relevé
          </Link>
        }
      />

      <div role="tablist" aria-label="Statut des paiements" className="mb-4 flex gap-1 overflow-x-auto border-b border-bordure">
        {ONGLETS.map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={statut === s}
            onClick={() => {
              setStatut(s)
              setPage(0)
            }}
            className={`whitespace-nowrap border-b-[3px] px-4 py-2.5 text-sm font-semibold ${
              statut === s ? 'border-rouge text-primaire' : 'border-transparent text-attenue hover:text-primaire'
            }`}
          >
            {STATUTS_PAIEMENT[s].libelle}
          </button>
        ))}
      </div>

      {erreur && <Alerte ton="erreur">{erreur}</Alerte>}
      {chargement && <ChargementPage />}
      {!chargement && donnees?.elements.length === 0 && (
        <EtatVide
          icone="task_alt"
          titre={statut === 'EN_ATTENTE' ? 'Aucun paiement à traiter' : 'Aucun paiement'}
          texte={statut === 'EN_ATTENTE' ? 'Toutes les références ont été traitées ou rapprochées automatiquement.' : undefined}
        />
      )}
      {!chargement && donnees && donnees.elements.length > 0 && (
        <div className="carte overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-bordure bg-surface text-left">
                {['Participant', 'Événement', 'Référence', 'Montant', 'Capture', 'Statut', ''].map((h) => (
                  <th key={h} scope="col" className="titre-section px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {donnees.elements.map((p) => (
                <tr key={p.id} className="border-b border-bordure last:border-0 hover:bg-surface">
                  <td className="px-4 py-3">
                    <p className="font-semibold">
                      {p.participantNom} {p.participantPrenom}
                    </p>
                    <p className="text-xs text-attenue">{p.participantEmail}</p>
                  </td>
                  <td className="px-4 py-3">{p.evenementTitre}</td>
                  <td className="px-4 py-3 font-mono text-[13px]">{p.referenceOperateur ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold">{montant(p.montant, p.devise)}</td>
                  <td className="px-4 py-3">{p.aCapture ? <Icone nom="attach_file" className="text-primaire" /> : <span className="text-attenue">—</span>}</td>
                  <td className="px-4 py-3">
                    <Badge ton={STATUTS_PAIEMENT[p.statut].ton}>{STATUTS_PAIEMENT[p.statut].libelle}</Badge>
                    {p.valideAutomatiquement && <span className="mt-1 block text-xs text-attenue">Rapprochement auto</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Bouton taille="petit" variante={statut === 'EN_ATTENTE' ? 'primaire' : 'secondaire'} onClick={() => setSelection(p)}>
                      {statut === 'EN_ATTENTE' ? 'Traiter' : 'Détails'}
                    </Bouton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {donnees && <Pagination page={donnees.page} totalPages={donnees.totalPages} surChangement={setPage} />}

      {selection && (
        <PanneauPaiement
          paiement={selection}
          surFermeture={() => setSelection(null)}
          surTraite={async () => {
            setSelection(null)
            await recharger()
          }}
        />
      )}
    </div>
  )
}

function PanneauPaiement({ paiement: p, surFermeture, surTraite }: { paiement: PaiementAdmin; surFermeture: () => void; surTraite: () => void }) {
  const [capture, setCapture] = useState<{ url: string; type: string } | null>(null)
  const [erreurCapture, setErreurCapture] = useState<string | null>(null)
  const [rejet, setRejet] = useState(false)
  const [motif, setMotif] = useState('')
  const [enCours, setEnCours] = useState<'valider' | 'rejeter' | 'rembourser' | null>(null)
  const toast = useToast()

  useEffect(() => {
    if (!p.aCapture) return
    let url: string | null = null
    adminPaiementService
      .capture(p.id)
      .then((c) => {
        url = c.url
        setCapture(c)
      })
      .catch((e) => setErreurCapture(messageErreur(e)))
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [p.id, p.aCapture])

  async function agir(type: 'valider' | 'rejeter' | 'rembourser') {
    setEnCours(type)
    try {
      if (type === 'valider') await adminPaiementService.valider(p.id)
      if (type === 'rejeter') await adminPaiementService.rejeter(p.id, motif.trim())
      if (type === 'rembourser') await adminPaiementService.marquerRembourse(p.id)
      toast.succes(type === 'valider' ? 'Paiement validé : le billet est émis' : type === 'rejeter' ? 'Paiement rejeté, participant informé' : 'Remboursement enregistré')
      surTraite()
    } catch (e) {
      toast.erreur(messageErreur(e))
    } finally {
      setEnCours(null)
    }
  }

  return (
    <Modale
      ouverte
      large
      titre={`Paiement de ${p.participantPrenom} ${p.participantNom}`}
      surFermeture={surFermeture}
      pied={
        p.statut === 'EN_ATTENTE' ? (
          rejet ? (
            <>
              <Bouton variante="fantome" onClick={() => setRejet(false)}>
                Retour
              </Bouton>
              <Bouton variante="danger" icone="block" disabled={!motif.trim()} enCours={enCours === 'rejeter'} onClick={() => agir('rejeter')}>
                Confirmer le rejet
              </Bouton>
            </>
          ) : (
            <>
              <Bouton variante="danger" icone="block" onClick={() => setRejet(true)}>
                Rejeter
              </Bouton>
              <Bouton icone="check_circle" className="!bg-succes hover:!bg-green-700" enCours={enCours === 'valider'} onClick={() => agir('valider')}>
                Valider le paiement
              </Bouton>
            </>
          )
        ) : p.statut === 'A_REMBOURSER' ? (
          <Bouton icone="currency_exchange" enCours={enCours === 'rembourser'} onClick={() => agir('rembourser')}>
            Marquer comme remboursé
          </Bouton>
        ) : undefined
      }
    >
      <div className="grid gap-5 md:grid-cols-2">
        <dl className="flex flex-col gap-3 text-sm">
          <Info libelle="Événement" valeur={p.evenementTitre} />
          <Info libelle="Participant" valeur={`${p.participantNom} ${p.participantPrenom} — ${p.participantEmail}`} />
          <Info libelle="Référence déclarée" valeur={<span className="font-mono">{p.referenceOperateur ?? '—'}</span>} />
          <Info libelle="Montant attendu" valeur={<strong className="text-rouge">{montant(p.montant, p.devise)}</strong>} />
          <Info libelle="Statut" valeur={<Badge ton={STATUTS_PAIEMENT[p.statut].ton}>{STATUTS_PAIEMENT[p.statut].libelle}</Badge>} />
          {p.valideLe && <Info libelle={p.statut === 'REJETE' ? 'Traité le' : 'Validé le'} valeur={`${dateHeure(p.valideLe)}${p.valideAutomatiquement ? ' (rapprochement automatique)' : ''}`} />}
          {p.motifRejet && <Info libelle="Motif du rejet" valeur={p.motifRejet} />}
          {p.statut === 'EN_ATTENTE' && (
            <Alerte ton="info">Vérifiez la référence et le montant sur le relevé de l'opérateur avant de valider.</Alerte>
          )}
        </dl>
        <div>
          <p className="titre-section mb-2">Capture jointe</p>
          {!p.aCapture ? (
            <div className="flex h-48 items-center justify-center rounded-lg bg-surface text-sm text-attenue">Aucune capture (facultative)</div>
          ) : erreurCapture ? (
            <Alerte ton="erreur">{erreurCapture}</Alerte>
          ) : !capture ? (
            <div className="flex h-48 items-center justify-center">
              <Chargement />
            </div>
          ) : capture.type === 'application/pdf' ? (
            <a href={capture.url} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-lg border-[1.5px] border-primaire px-4 font-semibold text-primaire">
              <Icone nom="picture_as_pdf" /> Ouvrir le PDF
            </a>
          ) : (
            <a href={capture.url} target="_blank" rel="noreferrer">
              <img src={capture.url} alt="Capture du paiement" className="max-h-96 w-full rounded-lg border border-bordure object-contain" />
            </a>
          )}
        </div>
      </div>
      {rejet && (
        <div className="mt-4">
          <ChampTexte libelle="Motif du rejet (envoyé au participant)" value={motif} onChange={(e) => setMotif(e.target.value)} maxLength={255} rows={3} />
        </div>
      )}
    </Modale>
  )
}

function Info({ libelle, valeur }: { libelle: string; valeur: React.ReactNode }) {
  return (
    <div>
      <dt className="titre-section">{libelle}</dt>
      <dd className="mt-0.5">{valeur}</dd>
    </div>
  )
}
