import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { messageErreur } from '../../../core/api/httpClient'
import { Bouton } from '../../../core/components/ui/Bouton'
import { Champ } from '../../../core/components/ui/Champ'
import { ChargementPage } from '../../../core/components/ui/Chargement'
import { Alerte } from '../../../core/components/ui/Divers'
import { Icone } from '../../../core/components/ui/Icone'
import { useRequete } from '../../../core/hooks/useRequete'
import { dateLongue, montant, tempsRestant } from '../../../core/utils/format'
import { reservationService } from '../services/reservationService'

const TAILLE_MAX = 5 * 1024 * 1024
const TYPES = ['image/jpeg', 'image/png', 'application/pdf']

/** EF-21 + §9 : numéro à copier, référence obligatoire, capture facultative vérifiée avant envoi. */
export function PaiementPage() {
  const { id } = useParams()
  const reservation = useRequete(() => reservationService.uneReservation(Number(id)), [id])
  const parametres = useRequete(() => reservationService.parametresPaiement(), [])
  const [reference, setReference] = useState('')
  const [capture, setCapture] = useState<File | null>(null)
  const [apercu, setApercu] = useState<string | null>(null)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoye, setEnvoye] = useState(false)
  const [copie, setCopie] = useState(false)
  const [enCours, setEnCours] = useState(false)

  if (reservation.chargement || parametres.chargement) return <ChargementPage />
  if (reservation.erreur || !reservation.donnees) return <Alerte ton="erreur">{reservation.erreur ?? 'Réservation introuvable'}</Alerte>
  const r = reservation.donnees
  const p = parametres.donnees

  async function copier() {
    if (!p?.numeroMobileMoney) return
    await navigator.clipboard.writeText(p.numeroMobileMoney)
    setCopie(true)
    setTimeout(() => setCopie(false), 2500)
  }

  function choisirFichier(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setErreurs((x) => ({ ...x, capture: '' }))
    if (apercu) URL.revokeObjectURL(apercu)
    setApercu(null)
    if (!f) {
      setCapture(null)
      return
    }
    if (!TYPES.includes(f.type)) {
      setErreurs((x) => ({ ...x, capture: 'Format accepté : JPG, PNG ou PDF' }))
      e.target.value = ''
      return
    }
    if (f.size > TAILLE_MAX) {
      setErreurs((x) => ({ ...x, capture: 'Fichier trop volumineux (5 Mo maximum)' }))
      e.target.value = ''
      return
    }
    setCapture(f)
    if (f.type.startsWith('image/')) setApercu(URL.createObjectURL(f))
  }

  async function soumettre(e: FormEvent) {
    e.preventDefault()
    const ref = reference.trim()
    if (!ref) {
      setErreurs({ reference: 'La référence de transaction est obligatoire' })
      return
    }
    if (ref.length > 50) {
      setErreurs({ reference: '50 caractères maximum' })
      return
    }
    setErreurs({})
    setErreur(null)
    setEnCours(true)
    try {
      await reservationService.soumettreReference(r.id, ref, capture)
      setEnvoye(true)
    } catch (err) {
      setErreur(messageErreur(err))
    } finally {
      setEnCours(false)
    }
  }

  const payable = r.statut === 'EN_ATTENTE_PAIEMENT' || r.statut === 'REJETEE'
  const etape = envoye ? 3 : 2

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/reservations" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primaire hover:underline">
        <Icone nom="arrow_back" taille={18} /> Mes réservations
      </Link>
      <h1 className="text-2xl font-bold sm:text-[28px]">Paiement de la réservation</h1>
      <p className="mt-1 text-attenue">
        {r.evenement.titre} — {dateLongue(r.evenement.dateDebut)}
      </p>

      <ol className="my-6 grid grid-cols-3 gap-2" aria-label="Étapes du paiement">
        {['Payer', 'Saisir la référence', 'Confirmation'].map((libelle, i) => (
          <li key={libelle} className="flex flex-col gap-2">
            <span className={`h-1.5 rounded-lg ${i + 1 <= etape ? 'bg-primaire' : 'bg-bordure'}`} />
            <span className={`text-xs font-semibold sm:text-sm ${i + 1 === etape ? 'text-primaire' : 'text-attenue'}`}>
              {i + 1}. {libelle}
            </span>
          </li>
        ))}
      </ol>

      {envoye ? (
        <div className="carte flex flex-col items-center p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-succes-clair text-succes">
            <Icone nom="task_alt" pleine taille={36} />
          </div>
          <h2 className="text-xl font-semibold">Référence envoyée</h2>
          <p className="mt-2 max-w-md text-attenue">
            Votre paiement est en cours de vérification. Dès qu'il est validé, votre billet avec QR code vous est envoyé par e-mail et
            apparaît dans « Mes billets ».
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link to="/reservations" className="inline-flex h-11 items-center rounded-lg bg-primaire px-4 font-semibold text-white">
              Mes réservations
            </Link>
            <Link to="/billets" className="inline-flex h-11 items-center rounded-lg border-[1.5px] border-primaire px-4 font-semibold text-primaire">
              Mes billets
            </Link>
          </div>
        </div>
      ) : !payable ? (
        <Alerte ton="info">Cette réservation n'attend pas de paiement (statut actuel : {r.statut.replaceAll('_', ' ').toLowerCase()}).</Alerte>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          <section className="carte p-5" aria-labelledby="etape1">
            <h2 id="etape1" className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primaire text-sm text-white">1</span>
              Payer par Mobile Money
            </h2>
            <p className="titre-section">Montant à payer</p>
            <p className="font-titre text-3xl font-extrabold text-rouge">{montant(r.montant, r.devise)}</p>
            {parametres.erreur || !p || !p.configure ? (
              <div className="mt-4">
                <Alerte ton="erreur">
                  {parametres.erreur ?? "Le numéro de paiement n'est pas encore renseigné par l'administration. Réessayez plus tard."}
                </Alerte>
              </div>
            ) : (
              <div className="mt-5 rounded-lg bg-primaire-clair p-4">
                <p className="titre-section">Numéro Mobile Money{p.operateur ? ` ${p.operateur}` : ''} de l'administration</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="chiffres font-titre text-2xl font-bold text-primaire-fonce">{p.numeroAffiche}</p>
                  <Bouton variante="secondaire" taille="petit" icone={copie ? 'check' : 'content_copy'} onClick={copier}>
                    {copie ? 'Copié' : 'Copier'}
                  </Bouton>
                </div>
                {p.titulaire && <p className="mt-1 text-sm text-attenue">Bénéficiaire : {p.titulaire}</p>}
              </div>
            )}
            {r.statut === 'REJETEE' && r.motif && (
              <div className="mt-4">
                <Alerte ton="erreur" titre="Précédente référence rejetée">
                  {r.motif}
                </Alerte>
              </div>
            )}
            {tempsRestant(r.expireLe) && (
              <p className="mt-4 flex items-center gap-1.5 text-sm text-alerte">
                <Icone nom="schedule" taille={18} /> Réservation retenue encore {tempsRestant(r.expireLe)}
              </p>
            )}
          </section>

          <form onSubmit={soumettre} noValidate className="carte flex flex-col gap-4 p-5" aria-labelledby="etape2">
            <h2 id="etape2" className="flex items-center gap-2 text-lg font-semibold">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primaire text-sm text-white">2</span>
              Déclarer votre paiement
            </h2>
            {erreur && <Alerte ton="erreur">{erreur}</Alerte>}
            <Champ
              libelle="Référence de la transaction"
              placeholder="Référence reçue par SMS"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              erreur={erreurs.reference}
              aide="Référence indiquée dans le SMS de confirmation de l'opérateur."
              autoComplete="off"
              maxLength={50}
            />
            <div>
              <label htmlFor="capture" className="etiquette">
                Capture d'écran <span className="font-normal text-attenue">(facultatif)</span>
              </label>
              <label
                htmlFor="capture"
                className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-[1.5px] border-dashed border-primaire-moyen bg-surface p-4 text-center text-sm text-attenue hover:border-primaire"
              >
                {apercu ? (
                  <img src={apercu} alt="Aperçu de la capture" className="max-h-40 rounded-lg" />
                ) : (
                  <Icone nom={capture ? 'picture_as_pdf' : 'upload_file'} taille={32} className="text-primaire" />
                )}
                <span>{capture ? capture.name : 'JPG, PNG ou PDF — 5 Mo maximum'}</span>
              </label>
              <input id="capture" type="file" accept="image/jpeg,image/png,application/pdf" className="sr-only" onChange={choisirFichier} />
              {erreurs.capture && (
                <p role="alert" className="mt-1.5 text-sm text-erreur">
                  {erreurs.capture}
                </p>
              )}
            </div>
            <Bouton type="submit" taille="grand" icone="send" enCours={enCours} className="mt-auto">
              Envoyer la référence
            </Bouton>
          </form>
        </div>
      )}
    </div>
  )
}
