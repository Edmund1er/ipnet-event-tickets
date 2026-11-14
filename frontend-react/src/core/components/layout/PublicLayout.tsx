import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Icone } from '../ui/Icone'
import { useImmersionActive, variablesImmersion } from './Immersion'

/**
 * Gabarit public inspiré du gabarit Dewi : en-tête fixe, transparent sur le hero de l'accueil puis bleu nuit
 * au défilement, pied de page sombre en colonnes, bouton de retour en haut.
 */
export function PublicLayout() {
  const { pathname } = useLocation()
  const accueil = pathname === '/'
  // Pages d'authentification : fond bleu nuit plein écran, carte centrée
  const auth = !accueil && !pathname.startsWith('/evenements')
  const [defile, setDefile] = useState(false)
  const immersion = useImmersionActive()

  useEffect(() => {
    const surDefilement = () => setDefile(window.scrollY > 40)
    surDefilement()
    window.addEventListener('scroll', surDefilement, { passive: true })
    return () => window.removeEventListener('scroll', surDefilement)
  }, [])

  return (
    <div
      className="flex min-h-screen flex-col bg-neutral-200 selection:bg-yellow-400 selection:text-neutral-700"
      data-immersif={immersion ? '' : undefined}
      style={immersion ? variablesImmersion(immersion) : undefined}
    >
      <header className={`sticky inset-x-0 z-50 flex w-full text-sm ${immersion ? 'top-0' : 'top-4'}`}>
        <nav
          className={`lay-header relative flex w-full items-center justify-between border ${
            immersion
              ? 'h-16 rounded-none px-4 sm:px-6'
              : 'mx-2 max-w-[85rem] rounded-[36px] border-yellow-100/40 bg-yellow-50/60 px-4 py-3 backdrop-blur-md md:px-6 lg:px-8 xl:mx-auto'
          }`}
          aria-label="Navigation"
        >
          {immersion?.retour ? (
            <Link to={immersion.retour.vers} className="lay-lien inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold">
              <Icone nom="arrow_back" taille={18} /> {immersion.retour.libelle}
            </Link>
          ) : null}
          <Link to="/" className="flex items-center gap-3 rounded-lg text-xl font-bold text-neutral-800" aria-label="IP Events — accueil">
            <span className="block h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-neutral-300">
              <img src="/logo_ipnet.jpg" alt="" className="h-full w-full origin-[58%_42%] scale-[1.6] object-cover object-[58%_42%]" />
            </span>
            <span className="text-lg font-bold tracking-tight">
              IPNET<span className="text-yellow-500">·</span>Events
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-7">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `hidden rounded-lg text-base font-medium transition-colors md:inline-block md:text-sm 2xl:text-base ${isActive ? 'text-orange-400' : 'text-neutral-600 hover:text-neutral-500'}`
              }
            >
              Événements
            </NavLink>
            <Link to="/connexion" className="rounded-lg text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-500 2xl:text-base">
              Connexion
            </Link>
            <Link
              to="/inscription"
              className="lay-bouton inline-flex items-center justify-center gap-x-2 rounded-lg bg-orange-400 px-4 py-2.5 text-sm font-bold text-neutral-50 transition duration-300 hover:bg-orange-500"
            >
              S'inscrire
            </Link>
          </div>
        </nav>
      </header>

      {immersion ? (
        <main id="contenu" className="w-full flex-1">
          <Outlet />
        </main>
      ) : auth ? (
        <main id="contenu" className="flex-1 px-3 pb-14 pt-12 sm:px-6 sm:pt-16">
          <Outlet />
        </main>
      ) : (
        <main id="contenu" className={`mx-auto w-full max-w-[85rem] flex-1 px-4 sm:px-6 lg:px-8 ${accueil ? '' : 'pb-12 pt-10'}`}>
          <Outlet />
        </main>
      )}

      {!immersion && (
      <footer className="bg-neutral-300 text-neutral-600">
        <div className="mx-auto grid w-full max-w-[85rem] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr_1.2fr] lg:px-16 lg:pt-20">
          <div>
            <p className="font-titre text-2xl font-extrabold tracking-tight text-neutral-800">
              IPNET<span className="text-yellow-500">·</span>Events
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed">
              La billetterie officielle d'IPNET Institute of Technology : réservez, payez par Mobile Money et entrez avec votre QR code.
            </p>
          </div>
          <nav aria-label="Plateforme" className="flex flex-col gap-3 text-sm">
            <p className="font-titre text-base font-bold text-neutral-800">Plateforme</p>
            <Link to="/" className="transition-colors hover:text-neutral-500">Événements</Link>
            <Link to="/connexion" className="transition-colors hover:text-neutral-500">Connexion</Link>
            <Link to="/inscription" className="transition-colors hover:text-neutral-500">Créer un compte</Link>
          </nav>
          <div className="flex flex-col gap-3 text-sm">
            <p className="font-titre text-base font-bold text-neutral-800">Services</p>
            <p>Réservation en ligne</p>
            <p>Paiement Mobile Money</p>
            <p>Contrôle d'accès QR</p>
          </div>
          <div className="flex flex-col gap-3 text-sm">
            <p className="font-titre text-base font-bold text-neutral-800">Contact</p>
            <p className="flex items-center gap-2"><Icone nom="location_on" taille={18} className="text-rouge" /> IPNET Institute of Technology, Lomé, Togo</p>
          </div>
        </div>
        <div className="py-5 text-center text-xs text-neutral-600">
          © {new Date().getFullYear()} IPNET Institute of Technology. Tous droits réservés.
        </div>
      </footer>
      )}

      <a
        href="#contenu"
        aria-label="Revenir en haut"
        onClick={(e) => {
          e.preventDefault()
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        className={`${immersion ? 'hidden' : ''} fixed bottom-4 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-400 text-neutral-50 shadow-lg transition-all duration-300 hover:bg-rouge-fonce ${defile ? 'visible opacity-100' : 'invisible opacity-0'}`}
      >
        <Icone nom="keyboard_arrow_up" taille={24} />
      </a>
    </div>
  )
}
