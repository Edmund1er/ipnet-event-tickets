import { Link } from 'react-router-dom'
import { ChargementPage } from '../../../core/components/ui/Chargement'
import { Alerte, EnteteSection, Tuile } from '../../../core/components/ui/Divers'
import { Icone } from '../../../core/components/ui/Icone'
import { useRequete } from '../../../core/hooks/useRequete'
import { dateLongue, montant } from '../../../core/utils/format'
import { administrationService } from '../services/administrationService'

export function TableauDeBordPage() {
  const kpi = useRequete(() => administrationService.tableauDeBord(), [])
  const prochains = useRequete(() => administrationService.prochainsEvenements(), [])

  if (kpi.chargement) return <ChargementPage />
  if (kpi.erreur || !kpi.donnees) return <Alerte ton="erreur">{kpi.erreur}</Alerte>
  const k = kpi.donnees

  return (
    <div>
      <EnteteSection icone="dashboard" titre="Tableau de bord" sousTitre="Vue d'ensemble de la billetterie" />

      <div className="mb-6 flex flex-col gap-3">
        {!k.paiementConfigure && (
          <Link to="/admin/parametres" className="block">
            <Alerte ton="erreur" titre="Numéro Mobile Money à renseigner">
              Les réservations restent fermées tant que le numéro qui reçoit les paiements n'est pas saisi. Cliquez pour le renseigner.
            </Alerte>
          </Link>
        )}
        {!k.smtpConfigure && (
          <Link to="/admin/parametres" className="block">
            <Alerte ton="erreur" titre="Messagerie non configurée">
              Les codes de vérification et les billets ne peuvent pas être envoyés : renseignez le SMTP dans le fichier .env.
            </Alerte>
          </Link>
        )}
        {k.paiementsATraiter > 0 && (
          <Link to="/admin/paiements" className="block">
            <Alerte ton="attention" titre={`${k.paiementsATraiter} paiement(s) à vérifier`}>
              Des références n'ont pas pu être rapprochées automatiquement. Cliquez pour les traiter.
            </Alerte>
          </Link>
        )}
        {k.notificationsEnEchec > 0 && (
          <Link to="/admin/notifications" className="block">
            <Alerte ton="erreur" titre={`${k.notificationsEnEchec} e-mail(s) non distribué(s)`}>
              Vérifiez la configuration SMTP puis relancez les envois.
            </Alerte>
          </Link>
        )}
        {k.paiementsARembourser > 0 && (
          <Link to="/admin/paiements" className="block">
            <Alerte ton="info" titre={`${k.paiementsARembourser} paiement(s) à rembourser`}>
              Suite à l'annulation d'un événement (remboursement manuel).
            </Alerte>
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tuile icone="event_available" libelle="Événements publiés" valeur={k.evenementsPublies} detail={`${k.evenementsBrouillons} brouillon(s)`} />
        <Tuile icone="hourglass_top" ton="orange" libelle="Réservations à payer" valeur={k.reservationsEnAttentePaiement} detail="En attente de paiement" />
        <Tuile icone="pending_actions" ton="rouge" libelle="Paiements à traiter" valeur={k.paiementsATraiter} detail="Références à vérifier" />
        <Tuile icone="confirmation_number" ton="vert" libelle="Billets valides" valeur={k.billetsValides} detail={`${k.billetsScannes} scanné(s) à l'entrée`} />
      </div>

      <section className="carte mt-6 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Prochains événements</h2>
          <Link to="/admin/evenements" className="text-sm font-semibold text-primaire hover:underline">
            Tout voir
          </Link>
        </div>
        {prochains.donnees?.elements.length === 0 && <p className="text-sm text-attenue">Aucun événement publié.</p>}
        <ul className="divide-y divide-bordure">
          {prochains.donnees?.elements.map((e) => {
            const pct = Math.round((e.placesReservees / e.capacite) * 100)
            return (
              <li key={e.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{e.titre}</p>
                  <p className="text-sm text-attenue">
                    {dateLongue(e.dateDebut)} · {montant(e.prix, e.devise)}
                  </p>
                </div>
                <div className="w-full sm:w-56">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="chiffres">
                      {e.placesReservees} / {e.capacite}
                    </span>
                    <span className="chiffres font-semibold text-primaire">{pct}%</span>
                  </div>
                  <div className="h-2 rounded bg-primaire-clair">
                    <div className="h-full rounded bg-primaire" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="flex gap-1">
                  <Link to={`/admin/evenements/${e.id}/participants`} className="inline-flex h-9 items-center gap-1 rounded px-2 text-sm font-semibold text-primaire hover:bg-primaire-clair">
                    <Icone nom="group" taille={18} /> Participants
                  </Link>
                  <Link to={`/controle/temps-reel?evenement=${e.id}`} className="inline-flex h-9 items-center gap-1 rounded px-2 text-sm font-semibold text-primaire hover:bg-primaire-clair">
                    <Icone nom="monitoring" taille={18} /> Entrées
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
