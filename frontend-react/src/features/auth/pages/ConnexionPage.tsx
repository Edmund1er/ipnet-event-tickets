import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../core/auth/AuthContext'
import { Bouton } from '../../../core/components/ui/Bouton'
import { Champ } from '../../../core/components/ui/Champ'
import { Alerte } from '../../../core/components/ui/Divers'
import { messageErreur } from '../../../core/api/httpClient'
import { accueilPour } from '../../../core/routing/Gardes'
import { CadreAuth } from '../components/CadreAuth'
import { ChampMotDePasse } from '../components/ChampsSpeciaux'
import { authService } from '../services/authService'

export function ConnexionPage() {
  const { ouvrir } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const depuis = (location.state as { depuis?: string } | null)?.depuis
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  async function soumettre(e: FormEvent) {
    e.preventDefault()
    setErreur(null)
    if (!email.trim() || !motDePasse) {
      setErreur('Renseignez votre e-mail et votre mot de passe.')
      return
    }
    setEnCours(true)
    try {
      const session = await authService.connexion(email.trim(), motDePasse)
      await ouvrir(session)
      if (!session.emailVerifie) {
        navigate('/verification', { replace: true, state: { envoyer: true } })
      } else {
        navigate(depuis ?? accueilPour(session.role), { replace: true })
      }
    } catch (err) {
      setErreur(messageErreur(err))
    } finally {
      setEnCours(false)
    }
  }

  return (
    <CadreAuth icone="login" titre="Connexion" sousTitre="Accédez à vos réservations et billets">
      <form onSubmit={soumettre} className="flex flex-col gap-4" noValidate>
        {erreur && <Alerte ton="erreur">{erreur}</Alerte>}
        <Champ libelle="E-mail" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <ChampMotDePasse valeur={motDePasse} surChangement={setMotDePasse} />
        <div className="text-right">
          <Link to="/mot-de-passe-oublie" className="text-sm font-semibold text-primaire hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>
        <Bouton type="submit" taille="grand" enCours={enCours} icone="login">
          Se connecter
        </Bouton>
        <p className="text-center text-sm text-attenue">
          Pas encore de compte ?{' '}
          <Link to="/inscription" className="font-semibold text-rouge hover:underline">
            Créer un compte
          </Link>
        </p>
      </form>
    </CadreAuth>
  )
}
