import { Link, NavLink, Outlet } from 'react-router-dom'
import { Logo } from './Logo'

/** Gabarit des pages publiques : barre flottante en verre dépoli, contenu aéré, pied de page structuré. */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-3 z-30 px-3 sm:top-4 sm:px-6">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 rounded-full border border-white/60 bg-white/70 pl-2 pr-2 shadow-lg shadow-primaire/5 backdrop-blur-xl sm:h-16 sm:gap-4 sm:pl-3 sm:pr-3">
          <Logo compact />
          <nav className="flex shrink-0 items-center gap-1 sm:gap-2" aria-label="Navigation">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `hidden rounded-full px-4 py-2 text-sm font-semibold transition-colors md:inline-block ${isActive ? 'bg-primaire-clair text-primaire' : 'text-attenue hover:text-primaire'}`
              }
            >
              Événements
            </NavLink>
            <Link
              to="/connexion"
              className="whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold text-primaire transition-colors hover:bg-primaire-clair sm:px-4"
            >
              Connexion
            </Link>
            <Link
              to="/inscription"
              className="whitespace-nowrap rounded-full bg-rouge px-4 py-2 text-sm font-semibold text-white shadow-md shadow-rouge/25 transition-all hover:-translate-y-px hover:bg-rouge-fonce sm:px-5"
            >
              <span className="sm:hidden">S'inscrire</span>
              <span className="hidden sm:inline">Créer un compte</span>
            </Link>
          </nav>
        </div>
      </header>

      <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-3 py-8 sm:px-6 sm:py-12">
        <Outlet />
      </main>

      <footer className="mt-8 border-t border-bordure/70 bg-white/70 backdrop-blur">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <p className="font-titre text-lg font-extrabold tracking-tight text-encre">
              ipnet<span className="text-rouge">-</span>event
            </p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-attenue">
              La billetterie officielle d'IPNET Institute of Technology : réservation, paiement Mobile Money et contrôle d'accès par QR code.
            </p>
          </div>
          <nav aria-label="Liens utiles" className="flex flex-col gap-2 text-sm">
            <p className="titre-section">Plateforme</p>
            <Link to="/" className="text-attenue transition-colors hover:text-primaire">Événements</Link>
            <Link to="/connexion" className="text-attenue transition-colors hover:text-primaire">Connexion</Link>
            <Link to="/inscription" className="text-attenue transition-colors hover:text-primaire">Créer un compte</Link>
          </nav>
          <div className="flex flex-col gap-2 text-sm text-attenue">
            <p className="titre-section">Paiement</p>
            <p>Mobile Money sécurisé</p>
            <p>Billet QR code par e-mail</p>
          </div>
        </div>
        <div className="border-t border-bordure/70 py-4 text-center text-xs text-attenue">
          © {new Date().getFullYear()} IPNET Institute of Technology. Tous droits réservés.
        </div>
      </footer>
    </div>
  )
}
