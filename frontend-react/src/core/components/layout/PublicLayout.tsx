import { Link, NavLink, Outlet } from 'react-router-dom'
import { Logo } from './Logo'

/** Gabarit des pages publiques (visiteur non connecté). */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b-[3px] border-rouge bg-white">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Navigation">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `hidden rounded px-3 py-2 text-sm font-semibold sm:inline-block ${isActive ? 'text-primaire' : 'text-attenue hover:text-primaire'}`
              }
            >
              Événements
            </NavLink>
            <Link to="/connexion" className="rounded px-3 py-2 text-sm font-semibold text-primaire hover:bg-primaire-clair">
              Se connecter
            </Link>
            <Link to="/inscription" className="rounded bg-rouge px-3 py-2 text-sm font-semibold text-white hover:bg-rouge-fonce sm:px-4">
              Créer un compte
            </Link>
          </nav>
        </div>
      </header>
      <main id="contenu" className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
      <footer className="border-t border-bordure bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-1 px-4 py-5 text-sm text-attenue sm:flex-row sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} IPNET Institute of Technology</p>
          <p>Billetterie officielle des événements de l'établissement</p>
        </div>
      </footer>
    </div>
  )
}
