import { Link, NavLink, Outlet } from 'react-router-dom'
import { Logo } from './Logo'

/** Gabarit des pages publiques (visiteur non connecté). */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-white/20 bg-white/70 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 shadow-sm shadow-slate-900/5">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
          <Logo />
          <nav className="flex shrink-0 items-center gap-1 sm:gap-2" aria-label="Navigation">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `hidden rounded-lg px-3 py-2 text-sm font-semibold transition-colors md:inline-block ${isActive ? 'bg-primaire-clair text-primaire' : 'text-attenue hover:text-primaire'}`
              }
            >
              Événements
            </NavLink>
            <Link
              to="/connexion"
              className="whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-semibold text-primaire transition-colors hover:bg-primaire-clair sm:px-3"
            >
              Connexion
            </Link>
            <Link
              to="/inscription"
              className="whitespace-nowrap rounded-lg bg-rouge px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-rouge/30 transition-colors hover:bg-rouge-fonce sm:px-4"
            >
              <span className="sm:hidden">S'inscrire</span>
              <span className="hidden sm:inline">Créer un compte</span>
            </Link>
          </nav>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-primaire via-primaire to-rouge" aria-hidden />
      </header>

      <main id="contenu" className="mx-auto w-full max-w-[1440px] flex-1 px-3 py-6 sm:px-6 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-bordure bg-white">
        <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-1 text-sm text-attenue md:items-end md:text-right">
            <p className="font-semibold text-encre">ipnet-event · billetterie officielle</p>
            <p>© {new Date().getFullYear()} IPNET Institute of Technology. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
