import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../core/auth/AuthContext'
import { Bouton } from '../../../core/components/ui/Bouton'
import { Champ } from '../../../core/components/ui/Champ'
import { ChargementPage } from '../../../core/components/ui/Chargement'
import { Alerte, EtatVide, Pagination } from '../../../core/components/ui/Divers'
import { Icone } from '../../../core/components/ui/Icone'
import { useRequete } from '../../../core/hooks/useRequete'
import { VitrineBas, VitrineHaut } from '../components/AccueilVitrine'
import { CarteEvenement } from '../components/CarteEvenement'
import { evenementService, type FiltresEvenements } from '../services/evenementService'

const CLES = ['titre', 'dateMin', 'dateMax', 'prixMin', 'prixMax'] as const

/** Agenda : filtres (date, prix, titre, conservés dans l'URL) et cartes des événements à venir. */
function AgendaEvenements({ connecte }: { connecte: boolean }) {
  const [params, setParams] = useSearchParams()
  const filtres: FiltresEvenements = {
    ...Object.fromEntries(CLES.map((c) => [c, params.get(c) ?? ''])),
    page: Number(params.get('page') ?? 0),
  }
  const [saisie, setSaisie] = useState(() => Object.fromEntries(CLES.map((c) => [c, params.get(c) ?? ''])) as Record<(typeof CLES)[number], string>)
  const { donnees, chargement, erreur } = useRequete(() => evenementService.lister(filtres), [params.toString()])
  const filtreActif = CLES.some((c) => params.get(c))

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
      <section id="evenements" className={`scroll-mt-20 ${connecte ? 'pb-10' : 'py-16'}`}>
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
  )
}

/**
 * Accueil. Visiteur : présentation puis événements. Client connecté : directement les cartes des événements,
 * sans présentation (il veut aller au but).
 */
export function ListeEvenementsPage() {
  const { session } = useAuth()
  const connecte = !!session
  return (
    <div>
      {!connecte && <VitrineHaut />}
      <AgendaEvenements connecte={connecte} />
      {!connecte && <VitrineBas />}
    </div>
  )
}
