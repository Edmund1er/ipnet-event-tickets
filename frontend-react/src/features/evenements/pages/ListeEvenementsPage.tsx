import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Bouton } from '../../../core/components/ui/Bouton'
import { Champ } from '../../../core/components/ui/Champ'
import { ChargementPage } from '../../../core/components/ui/Chargement'
import { Alerte, EtatVide, Pagination } from '../../../core/components/ui/Divers'
import { Icone } from '../../../core/components/ui/Icone'
import { useRequete } from '../../../core/hooks/useRequete'
import { CarteEvenement } from '../components/CarteEvenement'
import { dateLongue } from '../../../core/utils/format'
import { evenementService, type FiltresEvenements } from '../services/evenementService'

const CLES = ['titre', 'dateMin', 'dateMax', 'prixMin', 'prixMax'] as const

const ETAPES = [
  { icone: 'search', titre: '1. Choisissez', texte: 'Parcourez les événements publiés et trouvez celui qui vous intéresse.' },
  { icone: 'payments', titre: '2. Réservez et payez', texte: 'Créez votre compte, réservez votre place et réglez par Mobile Money.' },
  { icone: 'qr_code_scanner', titre: '3. Entrez', texte: "Recevez votre billet avec QR code par e-mail et présentez-le à l'entrée." },
]

/** EF-13 : événements publiés, filtres (date, prix, titre) et pagination. Filtres conservés dans l'URL. */
export function ListeEvenementsPage() {
  const [params, setParams] = useSearchParams()
  const filtres: FiltresEvenements = {
    ...Object.fromEntries(CLES.map((c) => [c, params.get(c) ?? ''])),
    page: Number(params.get('page') ?? 0),
  }
  const [saisie, setSaisie] = useState(() => Object.fromEntries(CLES.map((c) => [c, params.get(c) ?? ''])) as Record<(typeof CLES)[number], string>)
  const { donnees, chargement, erreur } = useRequete(() => evenementService.lister(filtres), [params.toString()])
  const filtreActif = CLES.some((c) => params.get(c))
  // Hero : lien vers le prochain événement publié
  const { donnees: prochains } = useRequete(() => evenementService.lister({ page: 0 }), [])
  const prochain = prochains?.elements[0] ?? null

  const chiffres = [
    { icone: 'event', valeur: prochains ? String(prochains.totalElements) : '—', libelle: 'Événements ouverts' },
    { icone: 'smartphone', valeur: 'Mobile Money', libelle: 'Paiement local' },
    { icone: 'qr_code_2', valeur: 'QR code', libelle: 'Billet par e-mail' },
    { icone: 'verified_user', valeur: '100 %', libelle: 'Accès contrôlé' },
  ]

  function appliquer(e: FormEvent) {
    e.preventDefault()
    const p = new URLSearchParams()
    CLES.forEach((c) => saisie[c].trim() && p.set(c, saisie[c].trim()))
    setParams(p)
  }

  function reinitialiser() {
    setSaisie({ titre: '', dateMin: '', dateMax: '', prixMin: '', prixMax: '' })
    setParams(new URLSearchParams())
  }

  return (
    <div>
      {/* HERO deux colonnes (gabarit ScrewFast) */}
      <section id="hero" className="mx-auto grid max-w-[85rem] gap-4 py-14 md:grid-cols-2 md:items-center md:gap-8">
        <div>
          <h1 className="apparition block text-balance text-3xl font-bold tracking-tight text-neutral-800 sm:text-4xl lg:text-6xl lg:leading-tight">
            Réservez. Payez. <span className="text-yellow-500">Entrez.</span>
          </h1>
          <p className="apparition apparition-2 mt-3 text-pretty text-lg leading-relaxed text-neutral-700 lg:w-4/5">
            La billetterie officielle des événements d'IPNET Institute of Technology : places en quelques clics, paiement Mobile Money, billet QR code.
          </p>
          <div className="apparition apparition-3 mt-7 grid w-full gap-3 sm:inline-flex">
            <a href="#evenements" className="btn-cta">
              Voir les événements
              <Icone nom="arrow_forward" taille={18} />
            </a>
            {prochain && (
              <Link to={`/evenements/${prochain.id}`} className="btn-contour max-w-full">
                <span className="truncate">Prochain : {prochain.titre}</span>
              </Link>
            )}
          </div>
          {prochain && <p className="mt-4 text-sm text-neutral-600">{dateLongue(prochain.dateDebut)}</p>}
        </div>
        <div className="flex w-full">
          <div className="w-full overflow-hidden rounded-xl">
            <img src="/logo_ipnet.jpg" alt="IPNET Institute of Technology" className="h-full w-full scale-110 object-cover object-center" draggable={false} />
          </div>
        </div>
      </section>

      {/* CHIFFRES */}
      <section className="bg-fond-clair py-12">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {chiffres.map((c) => (
            <div key={c.libelle} className="flex items-center gap-4 rounded-xl bg-neutral-100 p-6 shadow-xs ring-1 ring-neutral-300/60">
              <Icone nom={c.icone} taille={42} className="text-orange-400" />
              <div className="min-w-0">
                <p className="font-titre text-xl font-bold leading-tight text-encre">{c.valeur}</p>
                <p className="text-sm text-attenue">{c.libelle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="py-16">
        <div className="mx-auto max-w-[85rem]">
          <div className="titre-bloc">
            <span>Simple et rapide</span>
            <h2>Comment ça marche</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {ETAPES.map((e) => (
              <div key={e.titre} className="carte-service p-7">
                <div className="icone-carre mb-5">
                  <Icone nom={e.icone} taille={28} />
                </div>
                <h3 className="text-lg font-bold text-encre">{e.titre}</h3>
                <p className="mt-2 text-sm leading-relaxed text-attenue">{e.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ÉVÉNEMENTS */}
      <section id="evenements" className="scroll-mt-20 py-16">
        <div className="mx-auto max-w-[85rem]">
          <div className="titre-bloc">
            <span>Agenda</span>
            <h2>Les événements</h2>
          </div>

          <form
            onSubmit={appliquer}
            className="mb-8 grid gap-3 rounded-lg bg-white p-4 shadow-xs ring-1 ring-neutral-300/60 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]"
            aria-label="Filtrer les événements"
          >
            <Champ libelle="Rechercher" placeholder="Titre de l'événement" value={saisie.titre} onChange={(e) => setSaisie((s) => ({ ...s, titre: e.target.value }))} />
            <Champ libelle="Du" type="date" value={saisie.dateMin} onChange={(e) => setSaisie((s) => ({ ...s, dateMin: e.target.value }))} />
            <Champ libelle="Au" type="date" value={saisie.dateMax} onChange={(e) => setSaisie((s) => ({ ...s, dateMax: e.target.value }))} />
            <Champ libelle="Prix min (FCFA)" type="number" min={0} value={saisie.prixMin} onChange={(e) => setSaisie((s) => ({ ...s, prixMin: e.target.value }))} />
            <Champ libelle="Prix max (FCFA)" type="number" min={0} value={saisie.prixMax} onChange={(e) => setSaisie((s) => ({ ...s, prixMax: e.target.value }))} />
            <div className="flex items-end gap-2">
              <Bouton type="submit" icone="search" className="flex-1">
                Filtrer
              </Bouton>
              {filtreActif && (
                <Bouton variante="fantome" onClick={reinitialiser} aria-label="Réinitialiser les filtres">
                  <Icone nom="filter_alt_off" />
                </Bouton>
              )}
            </div>
          </form>

          {erreur && <Alerte ton="erreur">{erreur}</Alerte>}
          {chargement && <ChargementPage texte="Chargement des événements…" />}
          {!chargement && donnees && donnees.elements.length === 0 && (
            <EtatVide
              icone="event_busy"
              titre={filtreActif ? 'Aucun événement ne correspond' : 'Aucun événement publié pour le moment'}
              texte={filtreActif ? 'Modifiez ou réinitialisez vos filtres.' : 'Revenez bientôt : les prochains événements seront annoncés ici.'}
            />
          )}
          {!chargement && donnees && donnees.elements.length > 0 && (
            <>
              <p className="mb-4 text-sm text-attenue">
                {donnees.totalElements} événement{donnees.totalElements > 1 ? 's' : ''}
              </p>
              <div className="grid gap-8 pt-4 sm:grid-cols-2 xl:grid-cols-3">
                {donnees.elements.map((e) => (
                  <CarteEvenement key={e.id} evenement={e} />
                ))}
              </div>
              <Pagination
                page={donnees.page}
                totalPages={donnees.totalPages}
                surChangement={(p) => {
                  const n = new URLSearchParams(params)
                  n.set('page', String(p))
                  setParams(n)
                  document.getElementById('evenements')?.scrollIntoView({ behavior: 'smooth' })
                }}
              />
            </>
          )}
        </div>
      </section>
    </div>
  )
}
