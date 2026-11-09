import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Bouton } from '../../../core/components/ui/Bouton'
import { Champ } from '../../../core/components/ui/Champ'
import { Alerte } from '../../../core/components/ui/Divers'
import { messageErreur } from '../../../core/api/httpClient'
import { schemaEmail, schemaMotDePasse } from '../../../core/utils/validateurs'
import { CadreAuth } from '../components/CadreAuth'
import { ChampMotDePasse } from '../components/ChampsSpeciaux'
import { authService } from '../services/authService'

/** EF-06 : demande de réinitialisation (réponse identique que le compte existe ou non). */
export function MotDePasseOubliePage() {
  const [email, setEmail] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  async function soumettre(e: FormEvent) {
    e.preventDefault()
    const r = schemaEmail.safeParse(email)
    if (!r.success) {
      setErreur(r.error.issues[0].message)
      return
    }
    setErreur(null)
    setEnCours(true)
    try {
      setMessage((await authService.motDePasseOublie(r.data)).message)
    } catch (err) {
      setErreur(messageErreur(err))
    } finally {
      setEnCours(false)
    }
  }

  return (
    <CadreAuth icone="lock_reset" titre="Mot de passe oublié" sousTitre="Recevez un lien de réinitialisation par e-mail">
      {message ? (
        <div className="flex flex-col gap-4">
          <Alerte ton="succes">{message}</Alerte>
          <Link to="/connexion" className="text-center text-sm font-semibold text-primaire hover:underline">
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form onSubmit={soumettre} noValidate className="flex flex-col gap-4">
          <Champ libelle="E-mail du compte" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} erreur={erreur ?? undefined} />
          <Bouton type="submit" taille="grand" enCours={enCours} icone="send">
            Envoyer le lien
          </Bouton>
          <Link to="/connexion" className="text-center text-sm font-semibold text-primaire hover:underline">
            Retour à la connexion
          </Link>
        </form>
      )}
    </CadreAuth>
  )
}

export function ReinitialisationPage() {
  const [params] = useSearchParams()
  const jeton = params.get('jeton') ?? ''
  const navigate = useNavigate()
  const [mdp, setMdp] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  async function soumettre(e: FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    const r = schemaMotDePasse.safeParse(mdp)
    if (!r.success) errs.mdp = r.error.issues[0].message
    if (mdp !== confirmation) errs.confirmation = 'Les mots de passe ne correspondent pas'
    setErreurs(errs)
    if (Object.keys(errs).length) return
    setErreur(null)
    setEnCours(true)
    try {
      await authService.reinitialiser(jeton, mdp)
      navigate('/connexion', { replace: true, state: null })
    } catch (err) {
      setErreur(messageErreur(err))
    } finally {
      setEnCours(false)
    }
  }

  if (!jeton) {
    return (
      <CadreAuth icone="link_off" titre="Lien invalide">
        <Alerte ton="erreur">Ce lien de réinitialisation est incomplet. Refaites une demande.</Alerte>
        <Link to="/mot-de-passe-oublie" className="mt-4 block text-center text-sm font-semibold text-primaire hover:underline">
          Nouvelle demande
        </Link>
      </CadreAuth>
    )
  }

  return (
    <CadreAuth icone="password" titre="Nouveau mot de passe" sousTitre="Choisissez un mot de passe d'au moins 12 caractères">
      <form onSubmit={soumettre} noValidate className="flex flex-col gap-4">
        {erreur && <Alerte ton="erreur">{erreur}</Alerte>}
        <ChampMotDePasse libelle="Nouveau mot de passe" valeur={mdp} surChangement={setMdp} erreur={erreurs.mdp} avecJauge autoComplete="new-password" />
        <ChampMotDePasse libelle="Confirmation" valeur={confirmation} surChangement={setConfirmation} erreur={erreurs.confirmation} autoComplete="new-password" />
        <Bouton type="submit" taille="grand" enCours={enCours} icone="check">
          Enregistrer
        </Bouton>
      </form>
    </CadreAuth>
  )
}
