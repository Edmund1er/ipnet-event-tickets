import { useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { ROLES } from '../../constants/statuts'
import type { EntreeNavigation } from '../../navigation/types'
import { Icone } from '../ui/Icone'
import { Logo } from './Logo'
import { initiales } from '../../utils/format'

/**
 * Gabarit des espaces connectés (code visuel du gabarit Dewi) :
 * barre latérale bleu ciel, en-tête bleu nuit contrasté, entrée active en rouge, fond gris-bleu clair.
 * Les entrées de menu viennent des features et sont filtrées selon le rôle.
 */
export function AppLayout({ entrees }: { entrees: EntreeNavigation[] }) {
  const { role, profil, fermer } = useAuth()
  const [menuOuvert, setMenuOuvert] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const visibles = entrees.filter((e) => role && e.roles.includes(role)).sort((a, b) => a.ordre - b.ordre)
  const groupes = visibles.reduce<Record<string, EntreeNavigation[]>>((acc, e) => {
    ;(acc[e.groupe] ??= []).push(e)
    return acc
  }, {})

  const nomAffiche =
    profil?.prenom || profil?.nom ? `${profil?.prenom ?? ''} ${profil?.nom ?? ''}`.trim() : (profil?.email ?? '')

  async function deconnexion() {
    await fermer()
    navigate('/connexion', { replace: true })
  }

  return (
    <div className="min-h-screen bg-fond-clair">
      <a href="#contenu" className="sr-only z-[60] rounded-lg bg-rouge px-3 py-2 text-white focus:not-sr-only focus:fixed focus:left-2 focus:top-2">
        Aller au contenu
      </a>

      {/* Barre latérale bleu ciel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-ciel-fonce bg-ciel text-encre shadow-xl transition-transform lg:translate-x-0 ${
          menuOuvert ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navigation principale"
      >
        <div className="flex min-h-0 flex-col">
          <div className="flex h-16 items-center justify-between gap-3 border-b border-ciel-fonce px-4">
            <div className="flex items-center gap-3">
              <Logo compact />
              <span className="font-titre text-lg font-extrabold tracking-tight text-nuit">
                IPNET<span className="text-rouge">·</span>Events
              </span>
            </div>
            <button className="rounded-lg p-1 text-attenue hover:text-encre lg:hidden" onClick={() => setMenuOuvert(false)} aria-label="Fermer le menu">
              <Icone nom="close" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-4 py-5">
            {Object.entries(groupes).map(([groupe, items]) => (
              <div key={groupe} className="mb-6">
                <p className="mb-2 px-3 text-[11px] font-semibold text-primaire-fonce/70">{groupe}</p>
                <ul className="flex flex-col gap-1">
                  {items.map((e) => (
                    <li key={e.chemin}>
                      <NavLink
                        to={e.chemin}
                        end={e.chemin === '/'}
                        onClick={() => setMenuOuvert(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-all duration-200 ${
                            isActive ? 'bg-orange-400 font-bold text-neutral-50' : 'text-encre/80 hover:bg-white/70 hover:text-nuit'
                          }`
                        }
                      >
                        <Icone nom={e.icone} taille={22} />
                        {e.libelle}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="border-t border-ciel-fonce p-4">
          <button
            onClick={deconnexion}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-encre/80 transition-colors hover:bg-white/70 hover:text-rouge"
          >
            <Icone nom="logout" taille={22} />
            Se déconnecter
          </button>
        </div>
      </aside>
      {menuOuvert && <div className="fixed inset-0 z-40 bg-nuit/50 lg:hidden" onClick={() => setMenuOuvert(false)} aria-hidden />}

      <div className="lg:pl-72">
        {/* En-tête bleu nuit, texte blanc : bien lisible sur toute la largeur */}
        <header className="sticky top-3 z-30 mx-3 mt-3 flex h-16 items-center justify-between gap-3 rounded-[36px] border border-yellow-100/40 bg-yellow-50/70 px-5 text-neutral-800 shadow-xs backdrop-blur-md sm:mx-6 sm:px-6">
          <div className="flex items-center gap-3">
            <button className="rounded-lg p-2 text-neutral-800 lg:hidden" onClick={() => setMenuOuvert(true)} aria-label="Ouvrir le menu">
              <Icone nom="menu" />
            </button>
            <FilAriane chemin={location.pathname} entrees={visibles} />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight">{nomAffiche}</p>
              <p className="text-xs text-neutral-600">{role ? ROLES[role] : ''}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-400 text-sm font-bold text-neutral-50">
              {initiales(profil?.nom, profil?.prenom) !== '?' ? initiales(profil?.nom, profil?.prenom) : <Icone nom="person" />}
            </div>
          </div>
        </header>

        <main id="contenu" className="mx-auto w-full max-w-[1440px] px-3 py-6 sm:px-8 sm:py-9">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function FilAriane({ chemin, entrees }: { chemin: string; entrees: EntreeNavigation[] }): ReactNode {
  const actuelle = [...entrees]
    .sort((a, b) => b.chemin.length - a.chemin.length)
    .find((e) => (e.chemin === '/' ? chemin === '/' : chemin.startsWith(e.chemin)))
  return (
    <p className="hidden items-center gap-2 font-titre text-base font-bold tracking-wide text-neutral-800 sm:flex">
      <span className="inline-block h-2 w-2 rounded-full bg-rouge-vif" aria-hidden />
      {actuelle?.libelle ?? 'IPNET Events'}
    </p>
  )
}
