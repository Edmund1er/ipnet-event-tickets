import { useEffect, useState, type FormEvent } from 'react'
import { messageErreur, versErreurApi } from '../../../core/api/httpClient'
import { Badge } from '../../../core/components/ui/Badge'
import { Bouton } from '../../../core/components/ui/Bouton'
import { Champ } from '../../../core/components/ui/Champ'
import { ChampTelephone } from '../../../core/components/ui/ChampTelephone'
import { ChargementPage } from '../../../core/components/ui/Chargement'
import { Alerte, EnteteSection } from '../../../core/components/ui/Divers'
import { Icone } from '../../../core/components/ui/Icone'
import { useToast } from '../../../core/components/ui/Toasts'
import { useRequete } from '../../../core/hooks/useRequete'
import { dateHeure } from '../../../core/utils/format'
import { analyserTelephone, TYPES_MOBILE_MONEY } from '../../../core/utils/telephone'
import { parametresService, type AnalyseNumero, type ParametresPaiement } from '../services/parametresService'

/** EF-07 : numéro Mobile Money de réception (saisi et modifiable par l'administrateur) ; état de la messagerie. */
export function ParametresPage() {
  const { donnees, chargement, erreur, recharger } = useRequete(() => parametresService.lire(), [])
  const [test, setTest] = useState(false)
  const toast = useToast()

  async function tester() {
    setTest(true)
    try {
      toast.succes((await parametresService.testerEmail()).message)
    } catch (err) {
      toast.erreur(messageErreur(err))
    } finally {
      setTest(false)
    }
  }

  if (chargement) return <ChargementPage />
  if (erreur || !donnees) return <Alerte ton="erreur">{erreur}</Alerte>

  return (
    <div className="mx-auto max-w-5xl">
      <EnteteSection icone="settings" titre="Paramètres" sousTitre="Paiement Mobile Money et messagerie" />

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <FormulairePaiement key={donnees.paiement.modifieLe ?? 'nouveau'} p={donnees.paiement} surEnregistre={recharger} />

        <aside className="carte flex h-fit flex-col gap-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Messagerie</h2>
            {donnees.smtp.configure ? <Badge ton="vert">Configurée</Badge> : <Badge ton="rouge">Non configurée</Badge>}
          </div>
          {donnees.smtp.configure ? (
            <dl className="text-sm">
              <dt className="titre-section">Serveur</dt>
              <dd className="mb-2">
                {donnees.smtp.hote}:{donnees.smtp.port}
              </dd>
              <dt className="titre-section">Expéditeur</dt>
              <dd>{donnees.smtp.expediteur}</dd>
            </dl>
          ) : (
            <Alerte ton="erreur">
              Renseignez SMTP_HOST, SMTP_USERNAME et SMTP_PASSWORD dans le fichier <code>.env</code> puis redémarrez l'API. Sans messagerie,
              les codes de vérification et les billets ne peuvent pas être envoyés.
            </Alerte>
          )}
          <Bouton variante="secondaire" icone="outgoing_mail" enCours={test} disabled={!donnees.smtp.configure} onClick={tester}>
            Envoyer un e-mail de test
          </Bouton>
        </aside>
      </div>
    </div>
  )
}

function FormulairePaiement({ p, surEnregistre }: { p: ParametresPaiement; surEnregistre: () => Promise<void> }) {
  const [numero, setNumero] = useState(p.numeroMobileMoney ?? '')
  const [titulaire, setTitulaire] = useState(p.titulaire ?? '')
  const [operateur, setOperateur] = useState(p.operateur ?? '')
  const [analyse, setAnalyse] = useState<AnalyseNumero | null>(null)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [enCours, setEnCours] = useState(false)
  const toast = useToast()

  // Aperçu serveur (pays, type de ligne, opérateur d'origine) dès que le numéro est valide localement
  useEffect(() => {
    setAnalyse(null)
    if (!analyserTelephone(numero, undefined, TYPES_MOBILE_MONEY).valide) return
    const t = setTimeout(() => {
      parametresService.analyser(numero).then(setAnalyse).catch(() => undefined)
    }, 300)
    return () => clearTimeout(t)
  }, [numero])

  async function enregistrer(e: FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    const a = analyserTelephone(numero, undefined, TYPES_MOBILE_MONEY)
    if (!a.valide) errs.numero = a.message ?? 'Numéro invalide'
    if (!titulaire.trim()) errs.titulaire = 'Le nom du bénéficiaire est obligatoire'
    setErreurs(errs)
    if (Object.keys(errs).length) return
    setEnCours(true)
    try {
      await parametresService.enregistrerPaiement(a.e164!, titulaire.trim(), operateur.trim())
      toast.succes('Numéro de paiement enregistré : les réservations sont ouvertes.')
      await surEnregistre()
    } catch (err) {
      const api = versErreurApi(err)
      setErreurs({ numero: api.message })
    } finally {
      setEnCours(false)
    }
  }

  return (
        <form onSubmit={enregistrer} noValidate className="carte flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Numéro Mobile Money de réception</h2>
            {p.configure ? <Badge ton="vert">Configuré</Badge> : <Badge ton="orange">À renseigner</Badge>}
          </div>
          {!p.configure && (
            <Alerte ton="attention" titre="Réservations fermées">
              Les participants ne peuvent pas réserver tant que le numéro qui reçoit les paiements n'est pas renseigné.
            </Alerte>
          )}
          {p.configure && (
            <p className="text-sm text-attenue">
              Actuel : <strong className="text-encre">{p.numeroAffiche}</strong>
              {p.operateur && ` (${p.operateur})`} — modifié le {dateHeure(p.modifieLe)}
            </p>
          )}
          <ChampTelephone
            libelle="Numéro (ligne mobile)"
            valeur={numero}
            surChangement={setNumero}
            erreur={erreurs.numero}
            typesAcceptes={TYPES_MOBILE_MONEY}
          />
          {analyse && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-primaire-clair p-3 text-sm">
              <Icone nom="verified" pleine className="text-primaire" taille={20} />
              <span>
                {analyse.international} — {analyse.pays}
                {analyse.operateur ? ` — opérateur d'origine : ${analyse.operateur}` : ''}
              </span>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ libelle="Bénéficiaire affiché" value={titulaire} onChange={(e) => setTitulaire(e.target.value)} erreur={erreurs.titulaire} maxLength={120} />
            <Champ
              libelle="Opérateur affiché"
              facultatif
              value={operateur}
              onChange={(e) => setOperateur(e.target.value)}
              maxLength={60}
              aide={analyse?.operateur ? `Laissez vide pour « ${analyse.operateur} »` : 'Laissez vide pour la détection automatique'}
            />
          </div>
          <div className="flex justify-end">
            <Bouton type="submit" icone="save" enCours={enCours}>
              Enregistrer
            </Bouton>
          </div>
        </form>
  )
}
