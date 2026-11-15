import { useState, type FormEvent } from 'react'
import { messageErreur } from '../../../core/api/httpClient'
import { Badge } from '../../../core/components/ui/Badge'
import { Bouton } from '../../../core/components/ui/Bouton'
import { Champ } from '../../../core/components/ui/Champ'
import { ChampTelephone } from '../../../core/components/ui/ChampTelephone'
import { ChargementPage } from '../../../core/components/ui/Chargement'
import { Alerte, EnteteSection } from '../../../core/components/ui/Divers'
import { useToast } from '../../../core/components/ui/Toasts'
import { useRequete } from '../../../core/hooks/useRequete'
import { analyserTelephone, TYPES_MOBILE_MONEY } from '../../../core/utils/telephone'
import { parametresService, type ParametresPaiement } from '../services/parametresService'

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
  const initial = (code: 'MOOV' | 'MIXX') => (p.canaux ?? []).find((x) => x.code === code)
  const [numeroMoov, setNumeroMoov] = useState(initial('MOOV')?.numeroMobileMoney ?? '')
  const [titulaireMoov, setTitulaireMoov] = useState(initial('MOOV')?.titulaire ?? '')
  const [numeroMixx, setNumeroMixx] = useState(initial('MIXX')?.numeroMobileMoney ?? '')
  const [titulaireMixx, setTitulaireMixx] = useState(initial('MIXX')?.titulaire ?? '')
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [enCours, setEnCours] = useState(false)
  const toast = useToast()

  async function enregistrer(e: FormEvent) {
    e.preventDefault()
    const saisies = [
      { code: 'MOOV' as const, numero: numeroMoov, titulaire: titulaireMoov, champ: 'moov' },
      { code: 'MIXX' as const, numero: numeroMixx, titulaire: titulaireMixx, champ: 'mixx' },
    ]
    const errs: Record<string, string> = {}
    const canaux = saisies.map((x) => {
      if (!x.numero.trim()) {
        if (x.titulaire.trim()) errs[`${x.champ}Numero`] = 'Saisissez le numéro de réception.'
        return { code: x.code, numero: null, titulaire: null }
      }
      const analyse = analyserTelephone(x.numero, undefined, TYPES_MOBILE_MONEY)
      if (!analyse.valide) errs[`${x.champ}Numero`] = analyse.message ?? 'Numéro invalide'
      if (!x.titulaire.trim()) errs[`${x.champ}Titulaire`] = 'Le nom du bénéficiaire est obligatoire.'
      return { code: x.code, numero: analyse.e164 ?? x.numero.trim(), titulaire: x.titulaire.trim() || null }
    })
    if (!canaux.some((x) => x.numero)) errs.general = 'Configurez au moins un numéro de réception.'
    setErreurs(errs)
    if (Object.keys(errs).length) return
    setEnCours(true)
    try {
      await parametresService.enregistrerCanaux(canaux)
      toast.succes('Numéros de réception enregistrés.')
      await surEnregistre()
    } catch (err) {
      setErreurs({ general: messageErreur(err) })
    } finally {
      setEnCours(false)
    }
  }

  return (
    <form onSubmit={enregistrer} noValidate className="carte flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Numéros personnels de réception</h2>
        {p.configure ? <Badge ton="vert">Au moins un configuré</Badge> : <Badge ton="orange">À renseigner</Badge>}
      </div>
      <p className="text-sm text-attenue">Enregistrez le numéro normal du portefeuille qui recevra l’argent pour chaque réseau. Le client choisira le réseau et pourra payer depuis un numéro différent de celui de son compte.</p>
      {erreurs.general && <Alerte ton="erreur">{erreurs.general}</Alerte>}
      {!p.configure && <Alerte ton="attention" titre="Réservations fermées">Configurez au moins un numéro avant d’accepter des paiements.</Alerte>}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-bordure p-4">
          <h3 className="mb-3 font-semibold">Moov Money</h3>
          <ChampTelephone libelle="Numéro Moov de réception" valeur={numeroMoov} surChangement={setNumeroMoov} erreur={erreurs.moovNumero} typesAcceptes={TYPES_MOBILE_MONEY} />
          <div className="mt-3"><Champ libelle="Bénéficiaire" value={titulaireMoov} onChange={(e) => setTitulaireMoov(e.target.value)} erreur={erreurs.moovTitulaire} maxLength={120} /></div>
        </section>
        <section className="rounded-xl border border-bordure p-4">
          <h3 className="mb-3 font-semibold">Mixx by Yas (TogoCel)</h3>
          <ChampTelephone libelle="Numéro Mixx de réception" valeur={numeroMixx} surChangement={setNumeroMixx} erreur={erreurs.mixxNumero} typesAcceptes={TYPES_MOBILE_MONEY} />
          <div className="mt-3"><Champ libelle="Bénéficiaire" value={titulaireMixx} onChange={(e) => setTitulaireMixx(e.target.value)} erreur={erreurs.mixxTitulaire} maxLength={120} /></div>
        </section>
      </div>
      <div className="flex justify-end">
        <Bouton type="submit" icone="save" enCours={enCours}>Enregistrer les numéros</Bouton>
      </div>
    </form>
  )
}
