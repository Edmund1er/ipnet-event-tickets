import { useState } from 'react'
import { messageErreur } from '../../../core/api/httpClient'
import { Badge } from '../../../core/components/ui/Badge'
import { Bouton } from '../../../core/components/ui/Bouton'
import { ChampSelection } from '../../../core/components/ui/Champ'
import { ChargementPage } from '../../../core/components/ui/Chargement'
import { Alerte, EnteteSection, EtatVide, Pagination } from '../../../core/components/ui/Divers'
import { useToast } from '../../../core/components/ui/Toasts'
import { MODELES_NOTIFICATION, STATUTS_OUTBOX, type StatutOutbox } from '../../../core/constants/statuts'
import { useRequete } from '../../../core/hooks/useRequete'
import { dateHeure } from '../../../core/utils/format'
import { administrationService } from '../services/administrationService'

/** Suivi de l'outbox e-mail (§6 Fiabilité) et relance des envois en échec. */
export function NotificationsPage() {
  const [statut, setStatut] = useState<StatutOutbox | ''>('')
  const [page, setPage] = useState(0)
  const { donnees, chargement, erreur, recharger } = useRequete(() => administrationService.notifications(statut, page), [statut, page])
  const [relance, setRelance] = useState<number | null>(null)
  const toast = useToast()

  async function relancer(id: number) {
    setRelance(id)
    try {
      await administrationService.relancer(id)
      toast.succes('Notification remise en file d’envoi')
      await recharger()
    } catch (e) {
      toast.erreur(messageErreur(e))
    } finally {
      setRelance(null)
    }
  }

  return (
    <div>
      <EnteteSection
        icone="mail"
        titre="Notifications"
        sousTitre="E-mails envoyés par la plateforme (codes, billets, rejets, annulations)"
        actions={
          <Bouton variante="secondaire" icone="refresh" onClick={() => recharger()}>
            Actualiser
          </Bouton>
        }
      />
      <div className="carte mb-4 p-4 sm:w-72">
        <ChampSelection
          libelle="Statut"
          value={statut}
          onChange={(e) => {
            setPage(0)
            setStatut(e.target.value as StatutOutbox | '')
          }}
        >
          <option value="">Tous</option>
          {Object.entries(STATUTS_OUTBOX).map(([k, v]) => (
            <option key={k} value={k}>
              {v.libelle}
            </option>
          ))}
        </ChampSelection>
      </div>
      {erreur && <Alerte ton="erreur">{erreur}</Alerte>}
      {chargement && <ChargementPage />}
      {!chargement && donnees?.elements.length === 0 && <EtatVide icone="mark_email_read" titre="Aucune notification" />}
      {!chargement && donnees && donnees.elements.length > 0 && (
        <div className="carte overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-bordure bg-surface text-left">
                {['Date', 'Destinataire', 'Type', 'Statut', 'Tentatives', ''].map((h) => (
                  <th key={h} scope="col" className="titre-section px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {donnees.elements.map((n) => (
                <tr key={n.id} className="border-b border-bordure align-top last:border-0">
                  <td className="chiffres whitespace-nowrap px-4 py-3">{dateHeure(n.creeLe)}</td>
                  <td className="px-4 py-3">{n.destinataire}</td>
                  <td className="px-4 py-3">{MODELES_NOTIFICATION[n.modele] ?? n.modele}</td>
                  <td className="px-4 py-3">
                    <Badge ton={STATUTS_OUTBOX[n.statut].ton}>{STATUTS_OUTBOX[n.statut].libelle}</Badge>
                    {n.derniereErreur && n.statut !== 'ENVOYEE' && <p className="mt-1 max-w-xs text-xs text-rouge">{n.derniereErreur}</p>}
                  </td>
                  <td className="chiffres px-4 py-3">{n.tentatives}</td>
                  <td className="px-4 py-3 text-right">
                    {n.statut === 'ECHEC' && (
                      <Bouton taille="petit" variante="secondaire" icone="replay" enCours={relance === n.id} onClick={() => relancer(n.id)}>
                        Relancer
                      </Bouton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {donnees && <Pagination page={donnees.page} totalPages={donnees.totalPages} surChangement={setPage} />}
    </div>
  )
}
