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
      <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-primaire-fonce via-primaire to-[#0a2342] text-white shadow-xl shadow-primaire/20">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-rouge/25 blur-3xl" aria-hidden />
        <div className="absolute inset-y-0 right-0 w-full sm:w-1/2 md:w-5/12 lg:w-1/3 overflow-hidden pointer-events-none" aria-hidden>
          <img
            src="/logo_ipnet.jpg"
            alt=""
            className="h-full w-full object-contain object-right opacity-30 md:opacity-40 mix-blend-screen p-4"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primaire-fonce via-transparent to-transparent hidden sm:block" />
        </div>
        <div className="relative z-10 max-w-2xl px-5 py-8 sm:px-10 sm:py-12">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-rouge px-3 py-1 text-xs font-bold shadow-md">
            <Icone nom="confirmation_number" taille={16} /> Billetterie officielle
          </p>
          <h1 className="text-[1.65rem] font-extrabold leading-tight tracking-tight sm:text-4xl">Les événements d'IPNET Institute of Technology</h1>
          <p className="mt-3 text-[15px] text-white/85 sm:text-base">
            Réservez votre place, payez par Mobile Money et recevez votre billet avec QR code par e-mail.
          </p>
          {prochain && (
            <Link
              to={`/evenements/${prochain.id}`}
              className="mt-6 inline-flex max-w-full items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primaire-fonce shadow-lg transition-transform hover:-translate-y-0.5"
            >
              <Icone nom="event" taille={18} className="text-rouge" />
              <span className="truncate">
                Prochain : {prochain.titre} — {dateLongue(prochain.dateDebut)}
              </span>
            </Link>
          )}
        </div>
      </section>

      <form onSubmit={appliquer} className="carte mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]" aria-label="Filtrer les événements">
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
