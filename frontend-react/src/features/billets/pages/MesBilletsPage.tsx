import { useState } from 'react'
import { Link } from 'react-router-dom'
import { messageErreur } from '../../../core/api/httpClient'
import { Badge } from '../../../core/components/ui/Badge'
import { Bouton } from '../../../core/components/ui/Bouton'
import { Chargement, ChargementPage } from '../../../core/components/ui/Chargement'
import { Alerte, EnteteSection, EtatVide, Modale } from '../../../core/components/ui/Divers'
import { Icone } from '../../../core/components/ui/Icone'
import { useToast } from '../../../core/components/ui/Toasts'
import { LogoImage } from '../../../core/components/layout/Logo'
import { useImageProtegee, useRequete } from '../../../core/hooks/useRequete'
import { dateLongue, heure } from '../../../core/utils/format'
import { billetService, type Billet } from '../services/billetService'

/** EF-30 à EF-32 : billets consultables et téléchargeables depuis le compte. */
export function MesBilletsPage() {
  const { donnees, chargement, erreur } = useRequete(() => billetService.mesBillets(), [])
  const [pleinEcran, setPleinEcran] = useState<Billet | null>(null)

  return (
    <div>
      <EnteteSection icone="qr_code_2" titre="Mes billets" sousTitre="Présentez le QR code à l'entrée de l'événement" />
      {erreur && <Alerte ton="erreur">{erreur}</Alerte>}
      {chargement && <ChargementPage />}
      {!chargement && donnees?.length === 0 && (
        <EtatVide
          icone="confirmation_number"
          titre="Aucun billet pour le moment"
          texte="Un billet est émis dès que votre paiement est validé."
          action={
            <Link to="/reservations" className="inline-flex h-11 items-center rounded-lg bg-primaire px-4 font-semibold text-white">
              Mes réservations
            </Link>
          }
        />
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        {donnees?.map((b) => <CarteBillet key={b.id} billet={b} surPleinEcran={() => setPleinEcran(b)} />)}
      </div>

      <Modale ouverte={!!pleinEcran} titre={pleinEcran?.evenementTitre ?? ''} surFermeture={() => setPleinEcran(null)}>
        {pleinEcran && <QrGrand billet={pleinEcran} />}
      </Modale>
    </div>
  )
}

function CarteBillet({ billet, surPleinEcran }: { billet: Billet; surPleinEcran: () => void }) {
  const { url, erreur } = useImageProtegee(billet.invalide ? null : billetService.cheminQr(billet.id))
  const [renvoi, setRenvoi] = useState(false)
  const toast = useToast()

  async function renvoyer() {
    setRenvoi(true)
    try {
      toast.succes((await billetService.renvoyer(billet.id)).message)
    } catch (e) {
      toast.erreur(messageErreur(e))
    } finally {
      setRenvoi(false)
    }
  }

  return (
    <article className={`carte relative flex flex-col overflow-hidden sm:flex-row ${billet.invalide ? 'opacity-80' : ''}`}>
      {/* Talon */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <LogoImage className="h-10" />
          {billet.invalide ? (
            <Badge ton="rouge">Invalide — événement annulé</Badge>
          ) : billet.scanneLe ? (
            <Badge ton="gris">Utilisé à {heure(billet.scanneLe)}</Badge>
          ) : (
            <Badge ton="vert">Valide</Badge>
          )}
        </div>
        <div>
          <p className="titre-section">Événement</p>
          <h2 className={`text-lg font-semibold leading-snug ${billet.invalide ? 'line-through decoration-rouge' : ''}`}>{billet.evenementTitre}</h2>
        </div>
        <div className="grid gap-2 text-sm">
          <p className="flex items-center gap-2">
            <Icone nom="calendar_month" taille={18} className="text-primaire" />
            {dateLongue(billet.evenementDate)}
          </p>
          {billet.evenementLieu && (
            <p className="flex items-center gap-2">
              <Icone nom="location_on" taille={18} className="text-primaire" />
              {billet.evenementLieu}
            </p>
          )}
          <p className="flex items-center gap-2">
            <Icone nom="person" taille={18} className="text-primaire" />
            {billet.porteurPrenom} {billet.porteurNom}
          </p>
        </div>
        {!billet.invalide && (
          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            {url && (
              <a
                href={url}
                download={`billet-${billet.evenementTitre.replace(/[^\w-]+/g, '-').toLowerCase()}.png`}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border-[1.5px] border-primaire px-3 text-sm font-semibold text-primaire hover:bg-primaire-clair"
              >
                <Icone nom="download" taille={18} /> Télécharger
              </a>
            )}
            <Bouton variante="fantome" taille="petit" icone="forward_to_inbox" enCours={renvoi} onClick={renvoyer}>
              Renvoyer par e-mail
            </Bouton>
          </div>
        )}
      </div>

      {/* Bord perforé */}
      <div className="relative hidden w-0 border-l-2 border-dashed border-bordure sm:block" aria-hidden>
        <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-surface" />
        <span className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-surface" />
      </div>

      {/* QR */}
      <div className="flex flex-col items-center justify-center gap-2 border-t-2 border-dashed border-bordure bg-white p-5 sm:w-56 sm:border-t-0">
        {billet.invalide ? (
          <div className="flex h-40 w-40 items-center justify-center rounded-lg bg-rouge-clair text-rouge">
            <Icone nom="block" taille={56} />
          </div>
        ) : url ? (
          <button type="button" onClick={surPleinEcran} className="rounded-lg focus-visible:outline-2" aria-label="Afficher le QR code en plein écran">
            <img src={url} alt={`QR code du billet ${billet.evenementTitre}`} className="h-40 w-40" />
          </button>
        ) : erreur ? (
          <p className="text-sm text-rouge">QR code indisponible</p>
        ) : (
          <div className="flex h-40 w-40 items-center justify-center">
            <Chargement />
          </div>
        )}
        {!billet.invalide && url && (
          <button type="button" onClick={surPleinEcran} className="inline-flex items-center gap-1 text-sm font-semibold text-primaire">
            <Icone nom="fullscreen" taille={18} /> Plein écran
          </button>
        )}
      </div>
    </article>
  )
}

function QrGrand({ billet }: { billet: Billet }) {
  const { url } = useImageProtegee(billetService.cheminQr(billet.id))
  return (
    <div className="flex flex-col items-center gap-3 py-2 text-center">
      {url ? <img src={url} alt="QR code du billet" className="w-full max-w-sm" /> : <Chargement taille={40} />}
      <p className="font-semibold">
        {billet.porteurPrenom} {billet.porteurNom}
      </p>
      <p className="text-sm text-attenue">{dateLongue(billet.evenementDate)}</p>
      <p className="text-xs text-attenue">Augmentez la luminosité de l'écran pour faciliter le scan.</p>
    </div>
  )
}
