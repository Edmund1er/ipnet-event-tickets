import { useState } from 'react'
import { ChargementPage } from '../../../core/components/ui/Chargement'
import { Alerte, EnteteSection, EtatVide, Pagination } from '../../../core/components/ui/Divers'
import { useRequete } from '../../../core/hooks/useRequete'
import { dateHeure } from '../../../core/utils/format'
import { administrationService } from '../services/administrationService'

const ACTIONS: Record<string, string> = {
  INSCRIPTION: 'Inscription',
  CONNEXION: 'Connexion',
  VERIFICATION_OTP: 'Vérification du compte',
  MODIFICATION_PROFIL: 'Modification du profil',
  SUPPRESSION_COMPTE: 'Suppression de compte',
  CHANGEMENT_FILIERE: 'Changement de filière',
  REINITIALISATION_MOT_DE_PASSE: 'Réinitialisation du mot de passe',
  CREATION_EVENEMENT: "Création d'événement",
  MODIFICATION_EVENEMENT: "Modification d'événement",
  PUBLICATION_EVENEMENT: "Publication d'événement",
  ANNULATION_EVENEMENT: "Annulation d'événement",
  CLOTURE_EVENEMENT: "Clôture d'événement",
  IMAGE_EVENEMENT: "Image d'événement",
  SUPPRESSION_IMAGE_EVENEMENT: "Suppression d'image",
  RESERVATION: 'Réservation',
  ANNULATION_RESERVATION: 'Annulation de réservation',
  SOUMISSION_PREUVE: 'Référence de paiement',
  VALIDATION_PAIEMENT: 'Validation de paiement',
  REJET_PAIEMENT: 'Rejet de paiement',
  REMBOURSEMENT_PAIEMENT: 'Remboursement',
  IMPORT_RELEVE: 'Import de relevé',
  CREATION_AGENT_SCAN: "Création d'agent",
  DESACTIVATION_AGENT_SCAN: "Désactivation d'agent",
}

/** EF-51 : journal d'audit (qui a fait quoi, quand). */
export function AuditPage() {
  const [page, setPage] = useState(0)
  const { donnees, chargement, erreur } = useRequete(() => administrationService.audit(page), [page])

  return (
    <div>
      <EnteteSection icone="history" titre="Journal d'audit" sousTitre="Traçabilité des actions sensibles (RG-16)" />
      {erreur && <Alerte ton="erreur">{erreur}</Alerte>}
      {chargement && <ChargementPage />}
      {!chargement && donnees?.elements.length === 0 && <EtatVide icone="history" titre="Journal vide" />}
      {!chargement && donnees && donnees.elements.length > 0 && (
        <div className="carte overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-bordure bg-surface text-left">
                {['Date', 'Acteur', 'Action', 'Cible'].map((h) => (
                  <th key={h} scope="col" className="titre-section px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {donnees.elements.map((a) => (
                <tr key={a.id} className="border-b border-bordure last:border-0">
                  <td className="chiffres whitespace-nowrap px-4 py-3">{dateHeure(a.horodatage)}</td>
                  <td className="px-4 py-3">{a.acteurEmail ?? <span className="text-attenue">Système / anonyme</span>}</td>
                  <td className="px-4 py-3 font-semibold">{ACTIONS[a.action] ?? a.action}</td>
                  <td className="px-4 py-3 text-attenue">
                    {a.typeCible.toLowerCase()} #{a.idCible}
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
