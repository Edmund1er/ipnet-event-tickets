import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../core/auth/AuthContext'
import { Bouton } from '../../../core/components/ui/Bouton'
import { Champ } from '../../../core/components/ui/Champ'
import { Alerte } from '../../../core/components/ui/Divers'
import { messageErreur, rafraichirSession } from '../../../core/api/httpClient'
import { accueilPour } from '../../../core/routing/Gardes'
import { schemaEmail } from '../../../core/utils/validateurs'
import { CadreAuth } from '../components/CadreAuth'
import { SaisieCode } from '../components/SaisieCode'
import { authService } from '../services/authService'

const DUREE_VALIDITE = 5 * 60 // RG-03 : 5 minutes

/** RG-01 : confirmation de l'adresse e-mail par code (envoyé à l'adresse du compte). */
export function VerificationPage() {
  const { session, profil, ouvrir, rechargerProfil } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [code, setCode] = useState('')
  const [restant, setRestant] = useState(DUREE_VALIDITE)
  const [erreur, setErreur] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [renvoiEnCours, setRenvoiEnCours] = useState(false)
  const [changement, setChangement] = useState<'saisie' | 'code' | null>(null)
  const [nouvelEmail, setNouvelEmail] = useState('')
  const envoiInitial = useRef(false)

  useEffect(() => {
    if (session?.emailVerifie) navigate(accueilPour(session.role), { replace: true })
  }, [session, navigate])

  useEffect(() => {
    const t = setInterval(() => setRestant((r) => Math.max(0, r - 1)), 1000)
    return () => clearInterval(t)
  }, [])

  // Après une connexion, un nouveau code est envoyé automatiquement (l'inscription l'a déjà fait)
  useEffect(() => {
    if (envoiInitial.current || !(location.state as { envoyer?: boolean } | null)?.envoyer) return
    envoiInitial.current = true
    void renvoyer(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function verifier(e: FormEvent) {
    e.preventDefault()
    if (code.length !== 6) {
      setErreur('Saisissez les 6 chiffres du code.')
      return
    }
    setErreur(null)
    setEnCours(true)
    try {
      if (changement === 'code') {
        await authService.confirmerChangementEmail(code)
        const s = await rafraichirSession()
        if (s) await ouvrir(s)
        else await rechargerProfil()
      } else {
        await ouvrir(await authService.verifierOtp(code))
      }
    } catch (err) {
      setErreur(messageErreur(err))
      setCode('')
    } finally {
      setEnCours(false)
    }
  }

  async function renvoyer(silencieux = false) {
    setErreur(null)
    setRenvoiEnCours(true)
    try {
      await authService.envoyerOtp()
      setRestant(DUREE_VALIDITE)
      setChangement(null)
      if (!silencieux) setInfo('Un nouveau code vient de vous être envoyé.')
    } catch (err) {
      setErreur(messageErreur(err))
    } finally {
      setRenvoiEnCours(false)
    }
  }

  async function demanderChangement(e: FormEvent) {
    e.preventDefault()
    const r = schemaEmail.safeParse(nouvelEmail)
    if (!r.success) {
      setErreur(r.error.issues[0].message)
      return
    }
    setErreur(null)
    setRenvoiEnCours(true)
    try {
      setInfo((await authService.demanderChangementEmail(r.data)).message)
      setChangement('code')
      setCode('')
      setRestant(DUREE_VALIDITE)
    } catch (err) {
      setErreur(messageErreur(err))
    } finally {
      setRenvoiEnCours(false)
    }
  }

  const mm = Math.floor(restant / 60)
  const ss = (restant % 60).toString().padStart(2, '0')
  const destination = changement === 'code' ? nouvelEmail.trim().toLowerCase() : profil?.email

  return (
    <CadreAuth icone="mark_email_read" titre="Confirmez votre adresse e-mail" sousTitre="Dernière étape avant d'utiliser votre compte">
      {changement === 'saisie' ? (
        <form onSubmit={demanderChangement} noValidate className="flex flex-col gap-4">
          {erreur && <Alerte ton="erreur">{erreur}</Alerte>}
          <p className="text-sm text-attenue">
            Adresse actuelle : <strong className="text-encre">{profil?.email}</strong>. Un code sera envoyé à la nouvelle adresse.
          </p>
          <Champ libelle="Nouvelle adresse e-mail" type="email" autoComplete="email" value={nouvelEmail} onChange={(e) => setNouvelEmail(e.target.value)} />
          <Bouton type="submit" taille="grand" icone="send" enCours={renvoiEnCours}>
            Recevoir le code
          </Bouton>
          <Bouton variante="fantome" onClick={() => setChangement(null)}>
            Annuler
          </Bouton>
        </form>
      ) : (
        <form onSubmit={verifier} className="flex flex-col gap-5">
          <p className="text-sm text-attenue">
            Saisissez le code à 6 chiffres envoyé à <strong className="text-encre">{destination}</strong>. Il est valable 5 minutes et limité à
            5 essais.
          </p>
          {erreur && <Alerte ton="erreur">{erreur}</Alerte>}
          {info && !erreur && <Alerte ton="succes">{info}</Alerte>}

          <SaisieCode valeur={code} surChangement={setCode} />

          <p className={`chiffres text-center text-sm ${restant === 0 ? 'text-rouge' : 'text-attenue'}`}>
            {restant > 0 ? `Code valable encore ${mm}:${ss}` : 'Code expiré : demandez-en un nouveau.'}
          </p>

          <Bouton type="submit" taille="grand" enCours={enCours} icone="verified">
            Confirmer
          </Bouton>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Bouton variante="secondaire" className="flex-1" enCours={renvoiEnCours} icone="refresh" onClick={() => renvoyer()}>
              Renvoyer un code
            </Bouton>
            <Bouton variante="fantome" className="flex-1" icone="alternate_email" onClick={() => setChangement('saisie')}>
              Changer d'adresse
            </Bouton>
          </div>
        </form>
      )}
    </CadreAuth>
  )
}
