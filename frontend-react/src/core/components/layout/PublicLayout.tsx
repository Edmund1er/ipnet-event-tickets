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
      className={`flex min-h-screen flex-col selection:bg-lime-300 selection:text-neutral-950 ${auth ? 'bg-[#08090e]' : 'bg-[#f4f2ef]'}`}
      data-immersif={immersion ? '' : undefined}
      style={immersion ? variablesImmersion(immersion) : undefined}
    >
      {!auth && <header className={`sticky inset-x-0 z-50 flex w-full text-sm ${immersion ? 'top-0' : 'top-4'}`}>
        <nav
          className={`lay-header relative flex w-full items-center justify-between border ${
            immersion
              ? 'h-16 rounded-none px-2 sm:px-6'
              : 'mx-2 max-w-[85rem] rounded-[24px] border-white/10 bg-[#12131b]/95 px-4 py-3 text-white shadow-lg shadow-black/10 backdrop-blur-xl md:px-6 lg:px-8 xl:mx-auto'
          }`}
          aria-label="Navigation"
        >
          {immersion?.retour ? (
            <Link to={immersion.retour.vers} className="lay-lien inline-flex items-center gap-1 rounded-lg px-1 py-1 text-sm font-semibold sm:px-2">
              <span aria-hidden="true" className="text-base leading-none">←</span> {immersion.retour.libelle}
            </Link>
          ) : null}
          <Link to="/" className="flex items-center gap-3 rounded-lg text-xl font-bold text-white" aria-label="IP Events — accueil">
            <span className="block h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-white/20">
              <img src="/logo_ipnet.jpg" alt="" className="h-full w-full origin-[58%_42%] scale-[1.6] object-cover object-[58%_42%]" />
            </span>
            <span className="hidden text-lg font-bold tracking-tight sm:block">
              IPNET<span className="text-[#ff653d]">·</span>Events
            </span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-4 lg:gap-7">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `hidden rounded-lg text-base font-medium transition-colors md:inline-block md:text-sm 2xl:text-base ${isActive ? 'text-lime-300' : 'text-white/70 hover:text-white'}`
              }
            >
              Événements
            </NavLink>
            <Link to="/connexion" className="rounded-lg text-sm font-medium text-white/75 transition-colors hover:text-white 2xl:text-base">
              Connexion
            </Link>
            <Link
              to="/inscription"
              className="lay-bouton inline-flex items-center justify-center gap-x-2 rounded-lg bg-[#ff653d] px-2 py-2.5 text-sm font-bold text-white transition duration-300 hover:bg-[#ff7956] sm:px-4"
            >
              S'inscrire
            </Link>
          </div>
        </nav>
      </header>}

      {auth ? (
        <main id="contenu" className="relative isolate grid min-h-screen flex-1 place-items-center overflow-hidden px-4 py-10 sm:px-6">
          <div aria-hidden="true" className="auth-orb pointer-events-none absolute -left-32 top-[-8rem] h-[28rem] w-[28rem] rounded-full bg-fuchsia-600/20 blur-3xl" />
          <div aria-hidden="true" className="auth-orb auth-orb-delayed pointer-events-none absolute -bottom-40 right-[-6rem] h-[32rem] w-[32rem] rounded-full bg-orange-500/15 blur-3xl" />
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
      <footer className="bg-[#101116] text-white/65">
        <div className="mx-auto grid w-full max-w-[85rem] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr_1.2fr] lg:px-16 lg:pt-20">
          <div>
            <p className="font-titre text-2xl font-extrabold tracking-tight text-white">
              IPNET<span className="text-[#ff653d]">·</span>Events
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed">
              Les sorties de la jeunesse au même endroit : réserve ta place, règle par Mobile Money et retrouve ton billet QR sur ton téléphone.
            </p>
          </div>
          <nav aria-label="Plateforme" className="flex flex-col gap-3 text-sm">
            <p className="font-titre text-base font-bold text-white">Plateforme</p>
            <Link to="/" className="transition-colors hover:text-neutral-500">Événements</Link>
            <Link to="/connexion" className="transition-colors hover:text-neutral-500">Connexion</Link>
            <Link to="/inscription" className="transition-colors hover:text-neutral-500">Créer un compte</Link>
          </nav>
          <div className="flex flex-col gap-3 text-sm">
            <p className="font-titre text-base font-bold text-white">Services</p>
            <p>Réservation en ligne</p>
            <p>Paiement Mobile Money</p>
            <p>Contrôle d'accès QR</p>
          </div>
          <div className="flex flex-col gap-3 text-sm">
            <p className="font-titre text-base font-bold text-white">Contact</p>
            <p className="flex items-center gap-2"><Icone nom="location_on" taille={18} className="text-rouge" /> Lomé, Togo</p>
          </div>
        </div>
        <div className="py-5 text-center text-xs text-white/65">
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
        className={`${immersion || auth ? 'hidden' : ''} fixed bottom-4 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff653d] text-white shadow-lg transition-all duration-300 hover:bg-[#ff7956] ${defile ? 'visible opacity-100' : 'invisible opacity-0'}`}
      >
        <Icone nom="keyboard_arrow_up" taille={24} />
      </a>
    </div>
  )
}
