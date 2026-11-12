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
  // Bandeau d'accueil : lien vers le prochain événement publié
  const { donnees: prochains } = useRequete(() => evenementService.lister({ page: 0 }), [])
  const prochain = prochains?.elements[0] ?? null

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
      <section className="apparition relative mb-10 overflow-hidden rounded-[2rem] border border-white/70 bg-white/60 px-5 py-12 text-center shadow-xl shadow-primaire/5 backdrop-blur sm:px-12 sm:py-16">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primaire/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-rouge/15 blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-3xl">
          <p className="pastille">
            <Icone nom="confirmation_number" taille={16} className="text-rouge" /> Billetterie officielle
          </p>
          <h1 className="mt-5 text-balance text-3xl font-extrabold leading-tight tracking-tight text-encre sm:text-5xl sm:leading-[1.1]">
            Vivez les événements d'<span className="texte-degrade">IPNET Institute of Technology</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-attenue sm:text-lg">
            Réservez votre place, payez par Mobile Money et recevez votre billet avec QR code par e-mail.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#evenements"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primaire px-7 text-[15px] font-semibold text-white shadow-lg shadow-primaire/30 transition-all hover:-translate-y-px hover:bg-primaire-fonce"
            >
              <Icone nom="event" taille={20} /> Voir les événements
            </a>
            {prochain && (
              <Link
                to={`/evenements/${prochain.id}`}
                className="inline-flex h-12 max-w-full items-center gap-2 rounded-full border border-bordure bg-white px-5 text-sm font-semibold text-encre transition-all hover:-translate-y-px hover:border-primaire/40"
              >
                <span className="truncate">
                  Prochain : {prochain.titre} — {dateLongue(prochain.dateDebut)}
                </span>
              </Link>
            )}
          </div>
        </div>
      </section>

      <form id="evenements" onSubmit={appliquer} className="carte apparition apparition-2 mb-6 scroll-mt-28 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]" aria-label="Filtrer les événements">
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
          <p className="mb-3 text-sm text-attenue">
            {donnees.totalElements} événement{donnees.totalElements > 1 ? 's' : ''}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        </>
      )}
    </div>
  )
}
