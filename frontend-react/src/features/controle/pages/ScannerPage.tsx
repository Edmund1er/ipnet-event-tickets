import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { messageErreur } from '../../../core/api/httpClient'
import { Bouton } from '../../../core/components/ui/Bouton'
import { ChargementPage } from '../../../core/components/ui/Chargement'
import { Alerte, EtatVide } from '../../../core/components/ui/Divers'
import { Icone } from '../../../core/components/ui/Icone'
import { heure, heureSecondes } from '../../../core/utils/format'
import { SelecteurEvenement } from '../components/SelecteurEvenement'
import { useEvenementControle } from '../hooks/useEvenementControle'
import { controleService, type ReponseScan, type Statistiques } from '../services/controleService'
import { PRESENTATION_RESULTAT, jouerSon } from '../utils/retourScan'
import { creerScannerQr, type ScannerQr } from '../wrappers/scannerQrWrapper'

const ID_LECTEUR = 'lecteur-qr'
const DELAI_AFFICHAGE = 2600
const ANTI_REBOND = 4000

/** EF-40 à EF-43 : poste de contrôle (caméra + saisie manuelle au clavier). */
export function ScannerPage() {
  const { evenements, chargement, erreur, evenement, choisir } = useEvenementControle()
  const [cameraActive, setCameraActive] = useState(false)
  const [erreurCamera, setErreurCamera] = useState<string | null>(null)
  const [resultat, setResultat] = useState<ReponseScan | null>(null)
  const [saisie, setSaisie] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreurScan, setErreurScan] = useState<string | null>(null)
  const [stats, setStats] = useState<Statistiques | null>(null)
  const [historique, setHistorique] = useState<(ReponseScan & { a: string })[]>([])
  const scanner = useRef<ScannerQr | null>(null)
  const dernier = useRef<{ jeton: string; t: number } | null>(null)
  const occupe = useRef(false)
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null)

  const rafraichirStats = useCallback(async () => {
    if (!evenement) return
    try {
      setStats(await controleService.statistiques(evenement.id))
    } catch {
      /* compteurs indisponibles momentanément */
    }
  }, [evenement])

  useEffect(() => {
    setStats(null)
    setHistorique([])
    void rafraichirStats()
  }, [rafraichirStats])

  const traiter = useCallback(
    async (jetonBrut: string) => {
      const jeton = jetonBrut.trim()
      if (!evenement || !jeton || occupe.current) return
      const maintenant = Date.now()
      if (dernier.current && dernier.current.jeton === jeton && maintenant - dernier.current.t < ANTI_REBOND) return
      dernier.current = { jeton, t: maintenant }
      occupe.current = true
      setEnCours(true)
      setErreurScan(null)
      try {
        const r = await controleService.scanner(jeton, evenement.id)
        jouerSon(r.resultat)
        setResultat(r)
        setHistorique((h) => [{ ...r, a: new Date().toISOString() }, ...h].slice(0, 8))
        if (minuterie.current) clearTimeout(minuterie.current)
        minuterie.current = setTimeout(() => setResultat(null), DELAI_AFFICHAGE)
        if (r.resultat === 'ACCEPTE') void rafraichirStats()
      } catch (e) {
        setErreurScan(messageErreur(e))
      } finally {
        occupe.current = false
        setEnCours(false)
      }
    },
    [evenement, rafraichirStats],
  )

  const traiterRef = useRef(traiter)
  traiterRef.current = traiter

  async function demarrerCamera() {
    setErreurCamera(null)
    try {
      scanner.current = creerScannerQr(ID_LECTEUR)
      await scanner.current.demarrer((t) => void traiterRef.current(t))
      setCameraActive(true)
    } catch (e) {
      scanner.current = null
      setErreurCamera(
        e instanceof Error && /permission|denied|NotAllowed/i.test(e.message + e.name)
          ? "Accès à la caméra refusé. Autorisez la caméra dans le navigateur ou utilisez la saisie manuelle."
          : "Caméra indisponible sur cet appareil. Utilisez la saisie manuelle.",
      )
    }
  }

  async function arreterCamera() {
    await scanner.current?.arreter()
    scanner.current = null
    setCameraActive(false)
  }

  useEffect(
    () => () => {
      void scanner.current?.arreter()
      if (minuterie.current) clearTimeout(minuterie.current)
    },
    [],
  )

  async function manuel(e: FormEvent) {
    e.preventDefault()
    await traiter(saisie)
    setSaisie('')
  }

  if (chargement) return <ChargementPage />

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-[28px]">Poste scanner &amp; contrôle</h1>
          <p className="text-sm text-attenue">Scannez le QR code du billet ou saisissez le code manuellement.</p>
        </div>
        <div className="md:w-96">
          <SelecteurEvenement evenements={evenements} evenement={evenement} surChoix={choisir} />
        </div>
      </div>

      {erreur && <Alerte ton="erreur">{erreur}</Alerte>}
      {!evenement ? (
        <EtatVide
          icone="event"
          titre={evenements.length ? 'Choisissez l’événement en cours' : 'Aucun événement publié'}
          texte={evenements.length ? 'Sélectionnez l’événement contrôlé à ce poste pour commencer.' : 'Le contrôle d’accès s’active dès qu’un événement est publié.'}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
          {/* Viseur */}
          <section className="flex flex-col gap-4">
            <div className="relative overflow-hidden rounded-xl bg-[rgba(15,23,42,0.92)]" style={{ minHeight: 360 }}>
              <div id={ID_LECTEUR} className="w-full [&_video]:!w-full [&_video]:object-cover" />
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-white">
                  <div className="relative h-[200px] w-[200px]">
                    {['left-0 top-0 border-l-4 border-t-4', 'right-0 top-0 border-r-4 border-t-4', 'bottom-0 left-0 border-b-4 border-l-4', 'bottom-0 right-0 border-b-4 border-r-4'].map((c) => (
                      <span key={c} className={`absolute h-10 w-10 border-white ${c}`} />
                    ))}
                    <Icone nom="qr_code_scanner" taille={72} className="absolute inset-0 m-auto h-fit w-fit text-white/50" />
                  </div>
                  {erreurCamera && <p className="max-w-sm text-sm text-red-200">{erreurCamera}</p>}
                  <Bouton taille="grand" icone="photo_camera" onClick={demarrerCamera}>
                    Activer la caméra
                  </Bouton>
                </div>
              )}

              {/* Superposition du résultat (maquette : plein cadre, couleur sémantique) */}
              {resultat && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 p-6 text-center text-white ${PRESENTATION_RESULTAT[resultat.resultat].fond}`}
                  onClick={() => setResultat(null)}
                >
                  <Icone nom={PRESENTATION_RESULTAT[resultat.resultat].icone} pleine taille={96} />
                  <p className="font-titre text-3xl font-extrabold tracking-wide sm:text-4xl">{PRESENTATION_RESULTAT[resultat.resultat].titre}</p>
                  {resultat.resultat === 'ACCEPTE' && (
                    <div>
                      <p className="text-2xl font-bold">
                        {resultat.nom} {resultat.prenom}
                      </p>
                      <p className="text-lg text-white/90">{resultat.detail}</p>
                      <p className="chiffres mt-1 text-white/80">Entrée à {heureSecondes(resultat.instant)}</p>
                    </div>
                  )}
                  {resultat.resultat === 'DEJA_UTILISE' && (
                    <p className="chiffres text-xl">Premier scan à {heureSecondes(resultat.premierScan)}</p>
                  )}
                  {resultat.resultat === 'MAUVAIS_EVENEMENT' && <p className="text-lg">Ce billet appartient à un autre événement.</p>}
                  {resultat.resultat === 'INVALIDE' && <p className="text-lg">QR code illisible, falsifié ou inconnu.</p>}
                  {resultat.resultat === 'EVENEMENT_ANNULE' && <p className="text-lg">Ce billet n'est plus valable.</p>}
                </div>
              )}
              {cameraActive && !resultat && (
                <div className="pointer-events-none absolute inset-x-[15%] top-[12%] h-0.5 bg-primaire-moyen shadow-[0_0_12px_#a9c4e6] laser" />
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {cameraActive && (
                <Bouton variante="secondaire" icone="videocam_off" onClick={arreterCamera}>
                  Arrêter la caméra
                </Bouton>
              )}
              <Link
                to={`/controle/temps-reel?evenement=${evenement.id}`}
                className="inline-flex h-11 items-center gap-2 rounded border-[1.5px] border-primaire px-4 font-semibold text-primaire hover:bg-primaire-clair"
              >
                <Icone nom="monitoring" /> Tableau temps réel
              </Link>
            </div>

            <form onSubmit={manuel} className="carte flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label htmlFor="saisie" className="etiquette">
                  Saisie manuelle du code
                </label>
                <input
                  id="saisie"
                  className="champ font-mono"
                  value={saisie}
                  onChange={(e) => setSaisie(e.target.value)}
                  placeholder="Code du billet (lecteur USB ou clavier)"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <Bouton type="submit" taille="grand" icone="how_to_reg" enCours={enCours} disabled={!saisie.trim()}>
                Valider
              </Bouton>
            </form>
            {erreurScan && <Alerte ton="erreur">{erreurScan}</Alerte>}
          </section>

          {/* Compteurs + derniers scans */}
          <aside className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="carte p-4">
                <p className="titre-section">Entrés</p>
                <p className="chiffres font-titre text-4xl font-extrabold text-primaire">{stats?.nombreEntrees ?? '—'}</p>
              </div>
              <div className="carte p-4">
                <p className="titre-section">Restants</p>
                <p className="chiffres font-titre text-4xl font-extrabold text-rouge">{stats?.nombreRestants ?? '—'}</p>
              </div>
            </div>
            <div className="carte p-4">
              <p className="titre-section mb-3">Derniers scans de ce poste</p>
              {historique.length === 0 ? (
                <p className="text-sm text-attenue">Aucun scan pour le moment.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-bordure">
                  {historique.map((h, i) => (
                    <li key={i} className="flex items-center gap-3 py-2.5">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${PRESENTATION_RESULTAT[h.resultat].fond}`}>
                        <Icone nom={PRESENTATION_RESULTAT[h.resultat].icone} taille={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {h.resultat === 'ACCEPTE' ? `${h.nom} ${h.prenom}` : PRESENTATION_RESULTAT[h.resultat].titre.toLowerCase()}
                        </p>
                      </div>
                      <span className="chiffres text-xs text-attenue">{heure(h.a)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
