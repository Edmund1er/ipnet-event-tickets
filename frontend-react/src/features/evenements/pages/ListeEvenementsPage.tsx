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
import { evenementService, urlImageEvenement, type FiltresEvenements } from '../services/evenementService'

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
  // Bandeau d'accueil alimenté par le prochain événement publié (image, titre et date proviennent de l'administration)
  const { donnees: prochains } = useRequete(() => evenementService.lister({ page: 0 }), [])
  const prochain = prochains?.elements.find((e) => e.aImage) ?? prochains?.elements[0] ?? null

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
      <section className="relative mb-8 overflow-hidden rounded-xl bg-primaire-fonce text-white">
        {prochain?.aImage && (
          <div className="absolute inset-y-0 right-0 hidden w-1/2 md:block">
            <img src={urlImageEvenement(prochain.id)} alt="" className="h-full w-full object-cover opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-r from-primaire-fonce via-primaire-fonce/60 to-transparent" />
          </div>
        )}
        <div className="relative max-w-xl px-6 py-10 sm:px-10 sm:py-14">
          <p className="mb-3 inline-flex items-center gap-2 rounded bg-rouge px-2.5 py-1 text-xs font-bold uppercase tracking-wider">
            <Icone nom="confirmation_number" taille={16} /> Billetterie officielle
          </p>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">Les événements d'IPNET Institute of Technology</h1>
          <p className="mt-3 text-white/85">
            Réservez votre place, payez par Mobile Money et recevez votre billet avec QR code par e-mail.
          </p>
          {prochain && (
            <Link
              to={`/evenements/${prochain.id}`}
              className="mt-5 inline-flex max-w-full items-center gap-2 rounded-md bg-white/15 px-3 py-2 text-sm font-semibold backdrop-blur hover:bg-white/25"
            >
              <Icone nom="event" taille={18} />
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
