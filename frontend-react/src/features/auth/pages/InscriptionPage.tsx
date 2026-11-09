import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Bouton } from '../../../core/components/ui/Bouton'
import { Champ, ChampSelection } from '../../../core/components/ui/Champ'
import { Alerte } from '../../../core/components/ui/Divers'
import { Icone } from '../../../core/components/ui/Icone'
import { versErreurApi } from '../../../core/api/httpClient'
import {
  erreursChamps,
  schemaEmail,
  schemaMotDePasse,
  schemaTelephone,
  schemaTexteObligatoire,
} from '../../../core/utils/validateurs'
import { CadreAuth } from '../components/CadreAuth'
import { ChampMotDePasse, ChampTelephone } from '../components/ChampsSpeciaux'
import { authService } from '../services/authService'
import type { Categorie, Filiere } from '../types/auth.types'

type Type = 'ETUDIANT' | 'VISITEUR'
const anneeCourante = new Date().getFullYear()
// RG-04 : jusqu'à l'année courante, sans borne basse stricte (cours du soir) — 25 ans proposés
const ANNEES = Array.from({ length: 26 }, (_, i) => anneeCourante - i)

const schemaBase = z.object({
  nom: schemaTexteObligatoire('Nom', 100),
  prenom: schemaTexteObligatoire('Prénom', 100),
  email: schemaEmail,
  telephone: schemaTelephone,
  motDePasse: schemaMotDePasse,
})

export function InscriptionPage() {
  const navigate = useNavigate()
  const [type, setType] = useState<Type | null>(null)
  const [filieres, setFilieres] = useState<Filiere[]>([])
  const [categories, setCategories] = useState<Categorie[]>([])
  const [erreurReferentiel, setErreurReferentiel] = useState<string | null>(null)
  const [f, setF] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    motDePasse: '',
    confirmation: '',
    filiereId: '',
    anneeInscriptionL1: '',
    categorieId: '',
    organisation: '',
  })
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  useEffect(() => {
    Promise.all([authService.filieres(), authService.categories()])
      .then(([fi, ca]) => {
        setFilieres(fi)
        setCategories(ca)
      })
      .catch((e) => setErreurReferentiel(versErreurApi(e).message))
  }, [])

  const maj = (cle: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [cle]: v }))

  async function soumettre(e: FormEvent) {
    e.preventDefault()
    if (!type) return
    setErreurGlobale(null)
    const res = schemaBase.safeParse(f)
    const errs = erreursChamps(res)
    if (f.motDePasse !== f.confirmation) errs.confirmation = 'Les mots de passe ne correspondent pas'
    if (type === 'ETUDIANT') {
      if (!f.filiereId) errs.filiereId = 'Choisissez votre filière'
      const annee = Number(f.anneeInscriptionL1)
      if (!f.anneeInscriptionL1 || !Number.isInteger(annee)) errs.anneeInscriptionL1 = "Indiquez l'année d'inscription en L1"
      else if (annee > anneeCourante) errs.anneeInscriptionL1 = `L'année ne peut pas dépasser ${anneeCourante}`
    } else if (!f.categorieId) {
      errs.categorieId = 'Choisissez votre catégorie'
    }
    setErreurs(errs)
    if (Object.keys(errs).length > 0 || !res.success) return

    setEnCours(true)
    try {
      const r = await authService.inscription({
        typeProfil: type,
        nom: res.data.nom,
        prenom: res.data.prenom,
        email: res.data.email,
        telephone: res.data.telephone,
        motDePasse: res.data.motDePasse,
        ...(type === 'ETUDIANT'
          ? { filiereId: Number(f.filiereId), anneeInscriptionL1: Number(f.anneeInscriptionL1) }
          : { categorieId: Number(f.categorieId), organisation: f.organisation.trim() || undefined }),
      })
      // Aucun compte n'existe encore : il sera créé après validation du code reçu par e-mail
      navigate('/inscription/verification', { replace: true, state: { email: r.email, validite: r.codeValideMinutes } })
    } catch (err) {
      const api = versErreurApi(err)
      if (api.champs) setErreurs(api.champs)
      setErreurGlobale(api.message)
    } finally {
      setEnCours(false)
    }
  }

  if (!type) {
    return (
      <CadreAuth icone="person_add" titre="Créer un compte" sousTitre="Étape 1 sur 2 — Choisissez votre profil" large>
        <div className="grid gap-4 sm:grid-cols-2">
          <CarteType
            icone="school"
            titre="Étudiant interne"
            texte="Vous êtes inscrit à IPNET Institute of Technology."
            onClick={() => setType('ETUDIANT')}
          />
          <CarteType
            icone="groups"
            titre="Visiteur externe"
            texte="Parent, étudiant d'une autre université, recruteur ou autre visiteur."
            onClick={() => setType('VISITEUR')}
          />
        </div>
        <p className="mt-6 text-center text-sm text-attenue">
          Déjà inscrit ?{' '}
          <Link to="/connexion" className="font-semibold text-primaire hover:underline">
            Se connecter
          </Link>
        </p>
      </CadreAuth>
    )
  }

  return (
    <CadreAuth
      icone={type === 'ETUDIANT' ? 'school' : 'groups'}
      titre={type === 'ETUDIANT' ? 'Inscription étudiant' : 'Inscription visiteur'}
      sousTitre="Étape 2 sur 2 — Vos informations"
      large
    >
      <form onSubmit={soumettre} noValidate className="flex flex-col gap-4">
        {erreurReferentiel && <Alerte ton="erreur">{erreurReferentiel}</Alerte>}
        {erreurGlobale && <Alerte ton="erreur">{erreurGlobale}</Alerte>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Champ libelle="Nom" autoComplete="family-name" value={f.nom} onChange={(e) => maj('nom')(e.target.value)} erreur={erreurs.nom} />
          <Champ libelle="Prénom" autoComplete="given-name" value={f.prenom} onChange={(e) => maj('prenom')(e.target.value)} erreur={erreurs.prenom} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Champ libelle="E-mail" type="email" autoComplete="email" value={f.email} onChange={(e) => maj('email')(e.target.value)} erreur={erreurs.email} />
          <ChampTelephone valeur={f.telephone} surChangement={maj('telephone')} erreur={erreurs.telephone} />
        </div>

        {type === 'ETUDIANT' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <ChampSelection libelle="Filière" value={f.filiereId} onChange={(e) => maj('filiereId')(e.target.value)} erreur={erreurs.filiereId}>
              <option value="">Sélectionnez…</option>
              {filieres.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.libelle}
                </option>
              ))}
            </ChampSelection>
            <ChampSelection
              libelle="Année d'inscription en L1"
              value={f.anneeInscriptionL1}
              onChange={(e) => maj('anneeInscriptionL1')(e.target.value)}
              erreur={erreurs.anneeInscriptionL1}
            >
              <option value="">Sélectionnez…</option>
              {ANNEES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </ChampSelection>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <ChampSelection libelle="Catégorie" value={f.categorieId} onChange={(e) => maj('categorieId')(e.target.value)} erreur={erreurs.categorieId}>
              <option value="">Sélectionnez…</option>
              {categories.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.libelle}
                </option>
              ))}
            </ChampSelection>
            <Champ
              libelle="Organisation"
              facultatif
              value={f.organisation}
              onChange={(e) => maj('organisation')(e.target.value)}
              erreur={erreurs.organisation}
            />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <ChampMotDePasse
            valeur={f.motDePasse}
            surChangement={maj('motDePasse')}
            erreur={erreurs.motDePasse}
            avecJauge
            autoComplete="new-password"
          />
          <ChampMotDePasse
            libelle="Confirmation"
            valeur={f.confirmation}
            surChangement={maj('confirmation')}
            erreur={erreurs.confirmation}
            autoComplete="new-password"
          />
        </div>

        <Alerte ton="info">Un code de vérification vous sera envoyé par e-mail pour valider votre compte.</Alerte>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Bouton variante="fantome" icone="arrow_back" onClick={() => setType(null)}>
            Changer de profil
          </Bouton>
          <Bouton type="submit" taille="grand" enCours={enCours} icone="how_to_reg">
            Créer mon compte
          </Bouton>
        </div>
      </form>
    </CadreAuth>
  )
}

function CarteType({ icone, titre, texte, onClick }: { icone: string; titre: string; texte: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-start gap-3 rounded-lg border-[1.5px] border-bordure bg-white p-5 text-left transition-colors hover:border-primaire hover:bg-primaire-clair"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primaire text-white group-hover:bg-rouge">
        <Icone nom={icone} taille={26} />
      </span>
      <span className="text-lg font-semibold">{titre}</span>
      <span className="text-sm text-attenue">{texte}</span>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-primaire">
        Continuer <Icone nom="arrow_forward" taille={18} />
      </span>
    </button>
  )
}
