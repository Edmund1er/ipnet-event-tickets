import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../core/auth/AuthContext'
import { http, messageErreur, rafraichirSession, versErreurApi } from '../../../core/api/httpClient'
import type { ProfilResponse } from '../../../core/api/types'
import { Badge } from '../../../core/components/ui/Badge'
import { Bouton } from '../../../core/components/ui/Bouton'
import { Champ, ChampSelection } from '../../../core/components/ui/Champ'
import { ChargementPage } from '../../../core/components/ui/Chargement'
import { Alerte, EnteteSection, Modale } from '../../../core/components/ui/Divers'
import { Icone } from '../../../core/components/ui/Icone'
import { useToast } from '../../../core/components/ui/Toasts'
import { ROLES } from '../../../core/constants/statuts'
import { useRequete } from '../../../core/hooks/useRequete'
import { dateCourte } from '../../../core/utils/format'
import { schemaEmail, schemaTelephone } from '../../../core/utils/validateurs'
import { ChampTelephone } from '../../../core/components/ui/ChampTelephone'
import { SaisieCode } from '../../auth/components/SaisieCode'

interface Filiere {
  id: number
  libelle: string
}

/** EF-08 (modification), EF-09 (changement de filière), §5.2 (suppression du compte). */
export function ProfilPage() {
  const { profil, rechargerProfil, fermer, ouvrir } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [f, setF] = useState({ nom: '', prenom: '', telephone: '', organisation: '' })
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [enCours, setEnCours] = useState(false)
  const [nouvelleFiliere, setNouvelleFiliere] = useState('')
  const [filiereEnCours, setFiliereEnCours] = useState(false)
  const [suppression, setSuppression] = useState(false)
  const [mdpSuppression, setMdpSuppression] = useState('')
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null)
  const [suppressionEnCours, setSuppressionEnCours] = useState(false)
  const [changementEmail, setChangementEmail] = useState<'saisie' | 'code' | null>(null)
  const [nouvelEmail, setNouvelEmail] = useState('')
  const [codeEmail, setCodeEmail] = useState('')
  const [erreurEmail, setErreurEmail] = useState<string | null>(null)
  const [emailEnCours, setEmailEnCours] = useState(false)
  const filieres = useRequete(
    () => (profil?.typeProfil === 'ETUDIANT' ? http.get<Filiere[]>('/referentiels/filieres').then((r) => r.data) : Promise.resolve([])),
    [profil?.typeProfil],
  )

  useEffect(() => {
    if (profil)
      setF({
        nom: profil.nom ?? '',
        prenom: profil.prenom ?? '',
        telephone: profil.telephone,
        organisation: profil.visiteur?.organisation ?? '',
      })
  }, [profil])

  if (!profil) return <ChargementPage />
  const participant = profil.typeProfil !== 'AUCUN'

  async function enregistrer(e: FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (participant) {
      if (!f.nom.trim()) errs.nom = 'Nom obligatoire'
      if (!f.prenom.trim()) errs.prenom = 'Prénom obligatoire'
    }
    const tel = schemaTelephone.safeParse(f.telephone)
    if (!tel.success) errs.telephone = tel.error.issues[0].message
    setErreurs(errs)
    if (Object.keys(errs).length || !tel.success) return
    setEnCours(true)
    try {
      await http.put<ProfilResponse>('/profil/moi', {
        nom: f.nom.trim(),
        prenom: f.prenom.trim(),
        telephone: tel.data,
        organisation: f.organisation.trim() || null,
      })
      await rechargerProfil()
      toast.succes('Profil mis à jour')
    } catch (err) {
      const api = versErreurApi(err)
      if (api.champs) setErreurs(api.champs)
      toast.erreur(api.message)
    } finally {
      setEnCours(false)
    }
  }

  async function changerFiliere() {
    if (!nouvelleFiliere) return
    setFiliereEnCours(true)
    try {
      await http.post('/profil/etudiant/filiere', { nouvelleFiliereId: Number(nouvelleFiliere) })
      await rechargerProfil()
      setNouvelleFiliere('')
      toast.succes('Filière modifiée')
    } catch (err) {
      toast.erreur(messageErreur(err))
    } finally {
      setFiliereEnCours(false)
    }
  }

  async function demanderChangementEmail() {
    const r = schemaEmail.safeParse(nouvelEmail)
    if (!r.success) {
      setErreurEmail(r.error.issues[0].message)
      return
    }
    setErreurEmail(null)
    setEmailEnCours(true)
    try {
      await http.post('/profil/moi/email', { nouvelEmail: r.data })
      setChangementEmail('code')
      setCodeEmail('')
    } catch (err) {
      setErreurEmail(messageErreur(err))
    } finally {
      setEmailEnCours(false)
    }
  }

  async function confirmerChangementEmail() {
    if (codeEmail.length !== 6) {
      setErreurEmail('Saisissez les 6 chiffres du code.')
      return
    }
    setErreurEmail(null)
    setEmailEnCours(true)
    try {
      await http.post('/profil/moi/email/confirmation', { code: codeEmail })
      const s = await rafraichirSession()
      if (s) await ouvrir(s)
      else await rechargerProfil()
      setChangementEmail(null)
      setNouvelEmail('')
      toast.succes('Adresse e-mail modifiée et vérifiée')
    } catch (err) {
      setErreurEmail(messageErreur(err))
    } finally {
      setEmailEnCours(false)
    }
  }

  async function supprimer() {
    setErreurSuppression(null)
    setSuppressionEnCours(true)
    try {
      await http.delete('/profil/moi', { data: { motDePasse: mdpSuppression } })
      await fermer()
      navigate('/', { replace: true })
    } catch (err) {
      setErreurSuppression(messageErreur(err))
    } finally {
      setSuppressionEnCours(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <EnteteSection icone="account_circle" titre="Mon profil" sousTitre={`Compte créé le ${dateCourte(profil.creeLe)}`} />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          <form onSubmit={enregistrer} noValidate className="carte flex flex-col gap-4 p-5">
            <h2 className="text-lg font-semibold">{participant ? 'Informations personnelles' : `Compte ${ROLES[profil.role].toLowerCase()}`}</h2>
            {participant && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Champ libelle="Nom" value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} erreur={erreurs.nom} />
                  <Champ libelle="Prénom" value={f.prenom} onChange={(e) => setF({ ...f, prenom: e.target.value })} erreur={erreurs.prenom} />
                </div>
              </>
            )}
            <ChampTelephone key={profil.telephone} valeur={f.telephone} surChangement={(v) => setF((x) => ({ ...x, telephone: v }))} erreur={erreurs.telephone} />
            {profil.typeProfil === 'VISITEUR' && (
              <Champ
                libelle="Organisation"
                facultatif
                value={f.organisation}
                onChange={(e) => setF({ ...f, organisation: e.target.value })}
                erreur={erreurs.organisation}
              />
            )}
            <div className="flex justify-end">
              <Bouton type="submit" icone="save" enCours={enCours}>
                Enregistrer
              </Bouton>
            </div>
          </form>

          {profil.etudiant && (
            <section className="carte p-5" aria-labelledby="filiere">
              <h2 id="filiere" className="mb-1 text-lg font-semibold">
                Filière
              </h2>
              <p className="mb-4 text-sm text-attenue">
                Actuelle : <strong className="text-encre">{profil.etudiant.filiereLibelle}</strong> — inscription en L1 en{' '}
                {profil.etudiant.anneeInscriptionL1}
              </p>
              {profil.etudiant.filiereModifiable ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <ChampSelection libelle="Nouvelle filière" className="flex-1" value={nouvelleFiliere} onChange={(e) => setNouvelleFiliere(e.target.value)}>
                    <option value="">Sélectionnez…</option>
                    {(filieres.donnees ?? [])
                      .filter((x) => x.id !== profil.etudiant!.filiereId)
                      .map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.libelle}
                        </option>
                      ))}
                  </ChampSelection>
                  <Bouton icone="swap_horiz" disabled={!nouvelleFiliere} enCours={filiereEnCours} onClick={changerFiliere}>
                    Changer
                  </Bouton>
                </div>
              ) : (
                <Alerte ton="info" titre="Filière verrouillée">
                  Le changement de filière n'est possible que jusqu'à la deuxième année (L2).
                </Alerte>
              )}
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-5">
          <div className="carte p-5">
            <h2 className="mb-3 text-lg font-semibold">Compte</h2>
            <dl className="flex flex-col gap-3 text-sm">
              <div>
                <dt className="titre-section">E-mail</dt>
                <dd className="mt-0.5 flex flex-wrap items-center gap-2 break-all">
                  {profil.email}
                  {profil.emailVerifie ? <Badge ton="vert">Vérifiée</Badge> : <Badge ton="orange">Non vérifiée</Badge>}
                </dd>
              </div>
              <div>
                <dt className="titre-section">Téléphone</dt>
                <dd className="mt-0.5">{profil.telephone}</dd>
              </div>
              <div>
                <dt className="titre-section">Type</dt>
                <dd className="mt-0.5">
                  {profil.typeProfil === 'ETUDIANT' ? 'Étudiant interne' : profil.typeProfil === 'VISITEUR' ? `Visiteur — ${profil.visiteur?.categorieLibelle}` : ROLES[profil.role]}
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-col gap-2">
              <Bouton variante="secondaire" taille="petit" icone="alternate_email" onClick={() => setChangementEmail('saisie')}>
                Changer d'adresse e-mail
              </Bouton>
              {!profil.emailVerifie && (
                <Link to="/verification" className="inline-flex h-9 items-center justify-center gap-1.5 rounded bg-primaire px-3 text-sm font-semibold text-white">
                  <Icone nom="verified" taille={18} /> Vérifier mon adresse
                </Link>
              )}
            </div>
            <p className="mt-3 text-xs text-attenue">Le type de compte ne peut pas être modifié.</p>
          </div>

          {participant && (
            <div className="carte border-rouge/30 p-5">
              <h2 className="mb-1 text-lg font-semibold text-rouge">Supprimer mon compte</h2>
              <p className="mb-4 text-sm text-attenue">Vos données personnelles sont anonymisées. Cette action est définitive.</p>
              <Bouton variante="danger" icone="delete_forever" onClick={() => setSuppression(true)}>
                Supprimer le compte
              </Bouton>
            </div>
          )}
        </aside>
      </div>

      <Modale
        ouverte={!!changementEmail}
        titre="Changer d'adresse e-mail"
        surFermeture={() => {
          setChangementEmail(null)
          setErreurEmail(null)
        }}
        pied={
          changementEmail === 'saisie' ? (
            <Bouton icone="send" enCours={emailEnCours} onClick={demanderChangementEmail}>
              Recevoir le code
            </Bouton>
          ) : (
            <Bouton icone="check" enCours={emailEnCours} onClick={confirmerChangementEmail}>
              Confirmer
            </Bouton>
          )
        }
      >
        <div className="flex flex-col gap-4">
          {erreurEmail && <Alerte ton="erreur">{erreurEmail}</Alerte>}
          {changementEmail === 'saisie' ? (
            <>
              <p className="text-sm">Un code sera envoyé à la nouvelle adresse pour prouver qu'elle vous appartient.</p>
              <Champ libelle="Nouvelle adresse e-mail" type="email" autoComplete="email" value={nouvelEmail} onChange={(e) => setNouvelEmail(e.target.value)} />
            </>
          ) : (
            <>
              <p className="text-sm">
                Saisissez le code envoyé à <strong>{nouvelEmail.trim().toLowerCase()}</strong> (valable 5 minutes).
              </p>
              <SaisieCode valeur={codeEmail} surChangement={setCodeEmail} />
            </>
          )}
        </div>
      </Modale>

      <Modale
        ouverte={suppression}
        titre="Supprimer définitivement le compte"
        surFermeture={() => setSuppression(false)}
        pied={
          <>
            <Bouton variante="fantome" onClick={() => setSuppression(false)}>
              Annuler
            </Bouton>
            <Bouton variante="danger" icone="delete_forever" disabled={!mdpSuppression} enCours={suppressionEnCours} onClick={supprimer}>
              Supprimer
            </Bouton>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {erreurSuppression && <Alerte ton="erreur">{erreurSuppression}</Alerte>}
          <p className="text-sm">Confirmez avec votre mot de passe. Vous ne pourrez plus vous connecter avec ce compte.</p>
          <Champ libelle="Mot de passe" type="password" autoComplete="current-password" value={mdpSuppression} onChange={(e) => setMdpSuppression(e.target.value)} />
        </div>
      </Modale>
    </div>
  )
}
