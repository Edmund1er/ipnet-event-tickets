import { useState, type FormEvent } from 'react'
import { messageErreur, versErreurApi } from '../../../core/api/httpClient'
import { Badge } from '../../../core/components/ui/Badge'
import { Bouton } from '../../../core/components/ui/Bouton'
import { Champ } from '../../../core/components/ui/Champ'
import { ChampTelephone } from '../../../core/components/ui/ChampTelephone'
import { ChargementPage } from '../../../core/components/ui/Chargement'
import { Alerte, EnteteSection, EtatVide, Modale } from '../../../core/components/ui/Divers'
import { useToast } from '../../../core/components/ui/Toasts'
import { useRequete } from '../../../core/hooks/useRequete'
import { dateCourte } from '../../../core/utils/format'
import { erreursChamps, schemaEmail, schemaMotDePasse, schemaTelephone } from '../../../core/utils/validateurs'
import { z } from 'zod'
import { administrationService, type AgentScan } from '../services/administrationService'

const schema = z.object({ email: schemaEmail, telephone: schemaTelephone, motDePasse: schemaMotDePasse })

/** EF-52 : création et désactivation des comptes agents de scan. */
export function AgentsScanPage() {
  const { donnees, chargement, erreur, recharger } = useRequete(() => administrationService.agents(), [])
  const [f, setF] = useState({ email: '', telephone: '', motDePasse: '' })
  const [cleFormulaire, setCleFormulaire] = useState(0)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [enCours, setEnCours] = useState(false)
  const [aDesactiver, setADesactiver] = useState<AgentScan | null>(null)
  const toast = useToast()

  async function creer(e: FormEvent) {
    e.preventDefault()
    const r = schema.safeParse(f)
    setErreurs(erreursChamps(r))
    if (!r.success) return
    setEnCours(true)
    try {
      await administrationService.creerAgent(r.data.email, r.data.telephone, r.data.motDePasse)
      toast.succes('Agent de scan créé')
      setF({ email: '', telephone: '', motDePasse: '' })
      setCleFormulaire((k) => k + 1)
      await recharger()
    } catch (err) {
      const api = versErreurApi(err)
      if (api.champs) setErreurs(api.champs)
      toast.erreur(api.message)
    } finally {
      setEnCours(false)
    }
  }

  async function desactiver() {
    if (!aDesactiver) return
    try {
      await administrationService.desactiverAgent(aDesactiver.id)
      toast.succes('Compte désactivé')
      setADesactiver(null)
      await recharger()
    } catch (err) {
      toast.erreur(messageErreur(err))
    }
  }

  return (
    <div>
      <EnteteSection icone="badge" titre="Agents de scan" sousTitre="Comptes autorisés au contrôle d'accès (aucun accès aux paiements)" />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div>
          {erreur && <Alerte ton="erreur">{erreur}</Alerte>}
          {chargement && <ChargementPage />}
          {!chargement && donnees?.length === 0 && <EtatVide icone="person_off" titre="Aucun agent" texte="Créez un compte pour chaque agent d'accueil." />}
          {!chargement && donnees && donnees.length > 0 && (
            <div className="carte overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-bordure bg-surface text-left">
                    {['Agent', 'Téléphone', 'Créé le', 'E-mail', 'État', ''].map((h) => (
                      <th key={h} scope="col" className="titre-section px-4 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {donnees.map((a) => (
                    <tr key={a.id} className="border-b border-bordure last:border-0">
                      <td className="px-4 py-3 font-semibold">{a.email}</td>
                      <td className="px-4 py-3">{a.telephone}</td>
                      <td className="px-4 py-3">{dateCourte(a.creeLe)}</td>
                      <td className="px-4 py-3">{a.emailVerifie ? <Badge ton="vert">Vérifiée</Badge> : <Badge ton="orange">À confirmer</Badge>}</td>
                      <td className="px-4 py-3">{a.actif ? <Badge ton="vert">Actif</Badge> : <Badge ton="gris">Désactivé</Badge>}</td>
                      <td className="px-4 py-3 text-right">
                        {a.actif && (
                          <Bouton taille="petit" variante="fantome" icone="person_off" className="!text-rouge" onClick={() => setADesactiver(a)}>
                            Désactiver
                          </Bouton>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <form onSubmit={creer} noValidate className="carte flex h-fit flex-col gap-4 p-5">
          <h2 className="text-lg font-semibold">Nouvel agent</h2>
          <Champ libelle="E-mail" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} erreur={erreurs.email} />
          <ChampTelephone key={cleFormulaire} valeur={f.telephone} surChangement={(v) => setF((x) => ({ ...x, telephone: v }))} erreur={erreurs.telephone} />
          <Champ
            libelle="Mot de passe initial"
            type="password"
            autoComplete="new-password"
            value={f.motDePasse}
            onChange={(e) => setF({ ...f, motDePasse: e.target.value })}
            erreur={erreurs.motDePasse}
            aide="12 caractères minimum, à transmettre à l'agent. Il confirmera son e-mail à sa première connexion."
          />
          <Bouton type="submit" icone="person_add" enCours={enCours}>
            Créer le compte
          </Bouton>
        </form>
      </div>

      <Modale
        ouverte={!!aDesactiver}
        titre="Désactiver le compte"
        surFermeture={() => setADesactiver(null)}
        pied={
          <>
            <Bouton variante="fantome" onClick={() => setADesactiver(null)}>
              Annuler
            </Bouton>
            <Bouton variante="danger" onClick={desactiver}>
              Désactiver
            </Bouton>
          </>
        }
      >
        <p>
          <strong>{aDesactiver?.email}</strong> ne pourra plus se connecter ni scanner de billets.
        </p>
      </Modale>
    </div>
  )
}
