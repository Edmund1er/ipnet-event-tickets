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
  // Les écrans de compte ont leur propre expérience plein écran; le parcours événementiel garde sa navigation.
  const auth = ['/connexion', '/inscription', '/verification', '/mot-de-passe-oublie', '/reinitialisation-mot-de-passe', '/installation'].some((route) => pathname.startsWith(route))
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
      className={`flex min-h-screen flex-col selection:bg-yellow-400 selection:text-neutral-700 ${accueil || auth ? 'bg-neutral-200' : 'bg-[#f4f2ef]'}`}
      data-immersif={immersion ? '' : undefined}
      style={immersion ? variablesImmersion(immersion) : undefined}
    >
      {!auth && <header className={`sticky inset-x-0 z-50 flex w-full text-sm ${immersion ? 'top-0' : 'top-4'}`}>
        <nav
          className={`lay-header relative flex w-full items-center justify-between border ${
            immersion
              ? 'h-16 rounded-none px-2 sm:px-6'
              : accueil
                ? 'mx-2 max-w-[85rem] rounded-[36px] border-yellow-100/40 bg-yellow-50/60 px-4 py-3 text-neutral-800 backdrop-blur-md md:px-6 lg:px-8 xl:mx-auto'
                : 'mx-2 max-w-[85rem] rounded-[24px] border-white/10 bg-[#12131b]/95 px-4 py-3 text-white shadow-lg shadow-black/10 backdrop-blur-xl md:px-6 lg:px-8 xl:mx-auto'
          }`}
          aria-label="Navigation"
        >
          {immersion?.retour ? (
            <Link to={immersion.retour.vers} className="lay-lien inline-flex items-center gap-1 rounded-lg px-1 py-1 text-sm font-semibold sm:px-2">
              <span aria-hidden="true" className="text-base leading-none">←</span> {immersion.retour.libelle}
            </Link>
          ) : null}
          <Link to="/" className={`flex items-center gap-3 rounded-lg text-xl font-bold ${accueil ? 'text-neutral-800' : 'text-white'}`} aria-label="IP Events — accueil">
            <span className={`block h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ${accueil ? 'ring-neutral-300' : 'ring-white/20'}`}>
              <img src="/logo_ipnet.jpg" alt="" className="h-full w-full origin-[58%_42%] scale-[1.6] object-cover object-[58%_42%]" />
            </span>
            <span className="hidden text-lg font-bold tracking-tight sm:block">
              IPNET<span className={accueil ? 'text-yellow-500' : 'text-[#ff653d]'}>·</span>Events
            </span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-4 lg:gap-7">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `hidden rounded-lg text-base font-medium transition-colors md:inline-block md:text-sm 2xl:text-base ${accueil ? (isActive ? 'text-orange-400' : 'text-neutral-600 hover:text-neutral-500') : (isActive ? 'text-lime-300' : 'text-white/70 hover:text-white')}`
              }
            >
              Événements
            </NavLink>
            <Link to="/connexion" className={`rounded-lg text-sm font-medium transition-colors 2xl:text-base ${accueil ? 'text-neutral-600 hover:text-neutral-500' : 'text-white/75 hover:text-white'}`}>
              Connexion
            </Link>
            <Link
              to="/inscription"
              className={`lay-bouton inline-flex items-center justify-center gap-x-2 rounded-lg px-2 py-2.5 text-sm font-bold transition duration-300 sm:px-4 ${accueil ? 'bg-orange-400 text-neutral-50 hover:bg-orange-500' : 'bg-[#ff653d] text-white hover:bg-[#ff7956]'}`}
            >
              S'inscrire
            </Link>
          </div>
        </nav>
      </header>}

      {auth ? (
        <main id="contenu" className="grid min-h-screen flex-1 place-items-center px-3 py-10 sm:px-6 sm:py-14">
          <Outlet />
        </main>
      ) : immersion ? (
        <main id="contenu" className="w-full flex-1">
          <Outlet />
        </main>
      ) : (
        <main id="contenu" className={`mx-auto w-full max-w-[85rem] flex-1 px-4 sm:px-6 lg:px-8 ${accueil ? '' : 'pb-12 pt-10'}`}>
          <Outlet />
        </main>
      )}

      {!immersion && !auth && (
      <footer className={accueil ? 'bg-neutral-300 text-neutral-600' : 'bg-[#101116] text-white/65'}>
        <div className="mx-auto grid w-full max-w-[85rem] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr_1.2fr] lg:px-16 lg:pt-20">
          <div>
            <p className={`font-titre text-2xl font-extrabold tracking-tight ${accueil ? 'text-neutral-800' : 'text-white'}`}>
              IPNET<span className={accueil ? 'text-yellow-500' : 'text-[#ff653d]'}>·</span>Events
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed">
              Les sorties de la jeunesse au même endroit : réserve ta place, règle par Mobile Money et retrouve ton billet QR sur ton téléphone.
            </p>
          </div>
          <nav aria-label="Plateforme" className="flex flex-col gap-3 text-sm">
            <p className={`font-titre text-base font-bold ${accueil ? 'text-neutral-800' : 'text-white'}`}>Plateforme</p>
            <Link to="/" className="transition-colors hover:text-neutral-500">Événements</Link>
            <Link to="/connexion" className="transition-colors hover:text-neutral-500">Connexion</Link>
            <Link to="/inscription" className="transition-colors hover:text-neutral-500">Créer un compte</Link>
          </nav>
          <div className="flex flex-col gap-3 text-sm">
            <p className={`font-titre text-base font-bold ${accueil ? 'text-neutral-800' : 'text-white'}`}>Services</p>
            <p>Réservation en ligne</p>
            <p>Paiement Mobile Money</p>
            <p>Contrôle d'accès QR</p>
          </div>
          <div className="flex flex-col gap-3 text-sm">
            <p className={`font-titre text-base font-bold ${accueil ? 'text-neutral-800' : 'text-white'}`}>Contact</p>
            <p className="flex items-center gap-2"><Icone nom="location_on" taille={18} className="text-rouge" /> Lomé, Togo</p>
          </div>
        </div>
        <div className={`py-5 text-center text-xs ${accueil ? 'text-neutral-600' : 'text-white/65'}`}>
          © {new Date().getFullYear()} IPNET Events · Lomé
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
        className={`${immersion || auth ? 'hidden' : ''} fixed bottom-4 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-lg shadow-lg transition-all duration-300 ${accueil ? 'bg-orange-400 text-neutral-50 hover:bg-orange-500' : 'bg-[#ff653d] text-white hover:bg-[#ff7956]'} ${defile ? 'visible opacity-100' : 'invisible opacity-0'}`}
      >
        <Icone nom="keyboard_arrow_up" taille={24} />
      </a>
    </div>
  )
}
