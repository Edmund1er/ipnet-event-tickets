import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../core/auth/AuthContext'
import { Bouton } from '../../../core/components/ui/Bouton'
import { Alerte } from '../../../core/components/ui/Divers'
import { messageErreur, versErreurApi } from '../../../core/api/httpClient'
import { accueilPour } from '../../../core/routing/Gardes'
import { CadreAuth } from '../components/CadreAuth'
import { SaisieCode } from '../components/SaisieCode'
import { authService } from '../services/authService'

const DELAI_RENVOI = 30

interface EtatVerification {
  email: string
  validite: number
}

/**
 * Étape 2 de l'inscription : le compte n'existe pas encore. Il n'est créé qu'une fois le code,
 * reçu à l'adresse e-mail saisie, correctement validé (RG-01, RG-03).
 */
export function VerificationInscriptionPage() {
  const location = useLocation()
  const etat = location.state as EtatVerification | null
  if (!etat?.email) return <Navigate to="/inscription" replace />
  return <Formulaire email={etat.email} validiteMinutes={etat.validite} />
}

function Formulaire({ email, validiteMinutes }: { email: string; validiteMinutes: number }) {
  const { ouvrir } = useAuth()
  const navigate = useNavigate()
  const duree = validiteMinutes * 60
  const [code, setCode] = useState('')
  const [restant, setRestant] = useState(duree)
  const [renvoiRestant, setRenvoiRestant] = useState(DELAI_RENVOI)
  const [erreur, setErreur] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [renvoiEnCours, setRenvoiEnCours] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setRestant((r) => Math.max(0, r - 1)), 1000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    if (!renvoiRestant) return
    const t = window.setTimeout(() => setRenvoiRestant((r) => Math.max(0, r - 1)), 1000)
    return () => window.clearTimeout(t)
  }, [renvoiRestant])

  async function verifier(e: FormEvent) {
    e.preventDefault()
    if (code.length !== 6) {
      setErreur('Saisissez les 6 chiffres du code.')
      return
    }
    setErreur(null)
    setInfo(null)
    setEnCours(true)
    try {
      const session = await authService.confirmerInscription(email, code)
      await ouvrir(session)
      navigate(accueilPour(session.role), { replace: true })
    } catch (err) {
      const api = versErreurApi(err)
      setErreur(api.message)
      if (!(api.status === 0 && api.message.startsWith('Serveur injoignable')) && api.status < 500) setCode('')
    } finally {
      setEnCours(false)
    }
  }

  async function renvoyer() {
    setErreur(null)
    setInfo(null)
    setRenvoiEnCours(true)
    try {
      const r = await authService.renvoyerCodeInscription(email)
      setRestant(r.codeValideMinutes * 60)
      setRenvoiRestant(DELAI_RENVOI)
      setCode('')
      setInfo('Un nouveau code vient de vous être envoyé.')
    } catch (err) {
      setErreur(messageErreur(err))
    } finally {
      setRenvoiEnCours(false)
    }
  }

  const mm = Math.floor(restant / 60)
  const ss = (restant % 60).toString().padStart(2, '0')

  return (
    <CadreAuth icone="mark_email_read" titre="Vérifiez votre e-mail" sousTitre="Votre compte sera créé dès que le code sera validé">
      <form onSubmit={verifier} className="flex flex-col gap-5">
        <p className="text-sm text-attenue">
          Saisissez le code à 6 chiffres envoyé à <strong className="break-all text-encre">{email}</strong>. Il est valable{' '}
          {validiteMinutes} minutes et limité à 5 essais. Tant qu'il n'est pas validé, aucun compte n'est créé.
        </p>
        {erreur && <Alerte ton="erreur">{erreur}</Alerte>}
        {info && !erreur && <Alerte ton="succes">{info}</Alerte>}

        <SaisieCode valeur={code} surChangement={setCode} />

        <p className={`chiffres text-center text-sm ${restant === 0 ? 'text-rouge' : 'text-attenue'}`}>
          {restant > 0 ? `Code valable encore ${mm}:${ss}` : 'Code expiré : demandez-en un nouveau.'}
        </p>

        <Bouton type="submit" taille="grand" enCours={enCours} icone="verified">
          Valider et créer mon compte
        </Bouton>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Bouton variante="secondaire" className="flex-1" disabled={renvoiRestant > 0} enCours={renvoiEnCours} icone="refresh" onClick={renvoyer}>
            {renvoiRestant > 0 ? `Renvoyer dans 00:${String(renvoiRestant).padStart(2, '0')}` : 'Renvoyer un code'}
          </Bouton>
          <Link
            to="/inscription"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold text-primaire hover:bg-primaire-clair"
          >
            Corriger mes informations
          </Link>
        </div>
      </form>
    </CadreAuth>
  )
}
