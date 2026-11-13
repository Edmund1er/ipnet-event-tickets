import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Icone } from '../ui/Icone'
import { Logo } from './Logo'

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

  useEffect(() => {
    const surDefilement = () => setDefile(window.scrollY > 40)
    surDefilement()
    window.addEventListener('scroll', surDefilement, { passive: true })
    return () => window.removeEventListener('scroll', surDefilement)
  }, [])

  const opaque = defile || !accueil

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${opaque ? 'bg-nuit/90 py-2.5 shadow-lg shadow-black/10 backdrop-blur-md' : 'bg-transparent py-4'}`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo compact />
            <span className="hidden font-titre text-xl font-extrabold tracking-tight text-white sm:block">
              IPNET<span className="text-rouge-vif">·</span>Events
            </span>
          </div>
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Navigation">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `hidden px-3 py-2 text-sm font-medium transition-colors md:inline-block ${isActive ? 'text-rouge-vif' : 'text-white/85 hover:text-white'}`
              }
            >
              Événements
            </NavLink>
            <Link to="/connexion" className="px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:text-white">
              Connexion
            </Link>
            <Link
              to="/inscription"
              className="rounded-lg border-2 border-white/70 px-3.5 py-1.5 text-sm font-semibold text-white transition-colors duration-300 hover:border-rouge hover:bg-rouge sm:px-5 sm:text-[13px]"
            >
              S'inscrire
            </Link>
          </nav>
        </div>
      </header>

      {auth ? (
        <main id="contenu" className="relative flex-1 overflow-hidden bg-nuit px-3 pb-14 pt-28 sm:px-6 sm:pt-32">
          <img src="/logo_ipnet.jpg" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-nuit/85 via-nuit/75 to-nuit/95" aria-hidden />
          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      ) : (
        <main id="contenu" className={`flex-1 ${accueil ? '' : 'mx-auto w-full max-w-6xl px-3 pb-12 pt-28 sm:px-6 sm:pt-32'}`}>
          <Outlet />
        </main>
      )}

      <footer className="bg-nuit text-white/75">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
          <div>
            <p className="font-titre text-2xl font-extrabold tracking-tight text-white">
              IPNET<span className="text-rouge-vif">·</span>Events
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed">
              La billetterie officielle d'IPNET Institute of Technology : réservez, payez par Mobile Money et entrez avec votre QR code.
            </p>
          </div>
          <nav aria-label="Plateforme" className="flex flex-col gap-3 text-sm">
            <p className="font-titre text-base font-bold text-white">Plateforme</p>
            <Link to="/" className="transition-colors hover:text-rouge">Événements</Link>
            <Link to="/connexion" className="transition-colors hover:text-rouge">Connexion</Link>
            <Link to="/inscription" className="transition-colors hover:text-rouge">Créer un compte</Link>
          </nav>
          <div className="flex flex-col gap-3 text-sm">
            <p className="font-titre text-base font-bold text-white">Services</p>
            <p>Réservation en ligne</p>
            <p>Paiement Mobile Money</p>
            <p>Contrôle d'accès QR</p>
          </div>
          <div className="flex flex-col gap-3 text-sm">
            <p className="font-titre text-base font-bold text-white">Contact</p>
            <p className="flex items-center gap-2"><Icone nom="location_on" taille={18} className="text-rouge" /> IPNET Institute of Technology, Lomé, Togo</p>
          </div>
        </div>
        <div className="border-t border-white/10 py-5 text-center text-xs text-white/55">
          © {new Date().getFullYear()} IPNET Institute of Technology. Tous droits réservés.
        </div>
      </footer>

      <a
        href="#contenu"
        aria-label="Revenir en haut"
        onClick={(e) => {
          e.preventDefault()
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        className={`fixed bottom-4 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-lg bg-rouge text-white shadow-lg transition-all duration-300 hover:bg-rouge-fonce ${defile ? 'visible opacity-100' : 'invisible opacity-0'}`}
      >
        <Icone nom="keyboard_arrow_up" taille={24} />
      </a>
    </div>
  )
}
