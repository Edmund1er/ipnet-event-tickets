import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../../../core/auth/AuthContext'
import { versErreurApi } from '../../../core/api/httpClient'
import { Bouton } from '../../../core/components/ui/Bouton'
import { Champ } from '../../../core/components/ui/Champ'
import { Alerte } from '../../../core/components/ui/Divers'
import { erreursChamps, schemaEmail, schemaMotDePasse, schemaTelephone } from '../../../core/utils/validateurs'
import { CadreAuth } from '../components/CadreAuth'
import { ChampMotDePasse, ChampTelephone } from '../components/ChampsSpeciaux'
import { authService } from '../services/authService'

const schema = z.object({
  code: z.string().trim().min(1, "Le code d'installation est obligatoire"),
  email: schemaEmail,
  telephone: schemaTelephone,
  motDePasse: schemaMotDePasse,
})

/** Premier lancement : création du compte administrateur avec le code affiché par le serveur. */
export function InstallationPage() {
  const { ouvrir } = useAuth()
  const navigate = useNavigate()
  const [f, setF] = useState({ code: '', email: '', telephone: '', motDePasse: '', confirmation: '' })
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  async function soumettre(e: FormEvent) {
    e.preventDefault()
    const r = schema.safeParse(f)
    const errs = erreursChamps(r)
    if (f.motDePasse !== f.confirmation) errs.confirmation = 'Les mots de passe ne correspondent pas'
    setErreurs(errs)
    if (!r.success || Object.keys(errs).length) return
    setErreur(null)
    setEnCours(true)
    try {
      await ouvrir(await authService.installer(r.data))
      navigate('/verification', { replace: true })
    } catch (err) {
      const api = versErreurApi(err)
      if (api.champs) setErreurs(api.champs)
      setErreur(api.message)
    } finally {
      setEnCours(false)
    }
  }

  return (
    <CadreAuth icone="rocket_launch" titre="Installation de la billetterie" sousTitre="Création du compte administrateur" large>
      <form onSubmit={soumettre} noValidate className="flex flex-col gap-4">
        <Alerte ton="info" titre="Code d'installation">
          Il est affiché dans la console du serveur (fenêtre « IPNET — API ») et enregistré dans le fichier{' '}
          <code className="font-mono">backend-spring/technology/code-installation.txt</code>.
        </Alerte>
        {erreur && <Alerte ton="erreur">{erreur}</Alerte>}
        <Champ
          libelle="Code d'installation"
          placeholder="XXXX-XXXX-XXXX"
          className="font-mono"
          autoComplete="off"
          value={f.code}
          onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })}
          erreur={erreurs.code}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Champ libelle="E-mail de l'administrateur" type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} erreur={erreurs.email} />
          <ChampTelephone valeur={f.telephone} surChangement={(v) => setF((x) => ({ ...x, telephone: v }))} erreur={erreurs.telephone} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ChampMotDePasse valeur={f.motDePasse} surChangement={(v) => setF((x) => ({ ...x, motDePasse: v }))} erreur={erreurs.motDePasse} avecJauge autoComplete="new-password" />
          <ChampMotDePasse libelle="Confirmation" valeur={f.confirmation} surChangement={(v) => setF((x) => ({ ...x, confirmation: v }))} erreur={erreurs.confirmation} autoComplete="new-password" />
        </div>
        <p className="text-sm text-attenue">Un code de confirmation sera envoyé à cette adresse e-mail.</p>
        <Bouton type="submit" taille="grand" icone="admin_panel_settings" enCours={enCours}>
          Créer l'administrateur
        </Bouton>
      </form>
    </CadreAuth>
  )
}
