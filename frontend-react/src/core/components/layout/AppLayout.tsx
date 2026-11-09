import { useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { ROLES } from '../../constants/statuts'
import type { EntreeNavigation } from '../../navigation/types'
import { Icone } from '../ui/Icone'
import { Logo } from './Logo'
import { initiales } from '../../utils/format'

/**
 * Gabarit des espaces connectés (maquette Stitch : barre latérale 288 px, en-tête 64 px).
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
    <div className="min-h-screen">
      <a href="#contenu" className="sr-only z-[60] rounded bg-primaire px-3 py-2 text-white focus:not-sr-only focus:fixed focus:left-2 focus:top-2">
        Aller au contenu
      </a>

      {/* Barre latérale */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between bg-white shadow-xl shadow-slate-900/5 border-r border-bordure transition-transform lg:translate-x-0 ${
          menuOuvert ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navigation principale"
      >
        <div className="flex min-h-0 flex-col">
          <div className="flex h-16 items-center justify-between border-b border-bordure bg-gradient-to-r from-primaire-clair/60 to-white px-4">
            <Logo compact />
            <button className="rounded p-1 text-attenue lg:hidden" onClick={() => setMenuOuvert(false)} aria-label="Fermer le menu">
              <Icone nom="close" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-4 py-4">
            {Object.entries(groupes).map(([groupe, items]) => (
              <div key={groupe} className="mb-5">
                <p className="titre-section mb-2 px-3">{groupe}</p>
                <ul className="flex flex-col gap-1">
                  {items.map((e) => (
                    <li key={e.chemin}>
                      <NavLink
                        to={e.chemin}
                        end={e.chemin === '/'}
                        onClick={() => setMenuOuvert(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors ${
                            isActive
                              ? 'bg-primaire font-semibold text-white shadow-md shadow-primaire/25'
                              : 'text-attenue hover:bg-primaire-clair hover:text-primaire'
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
        <div className="border-t border-bordure p-4">
          <button
            onClick={deconnexion}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-rouge hover:bg-rouge-clair"
          >
            <Icone nom="logout" taille={22} />
            Se déconnecter
          </button>
        </div>
      </aside>
      {menuOuvert && <div className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" onClick={() => setMenuOuvert(false)} aria-hidden />}

      <div className="lg:pl-72">
        {/* En-tête */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-bordure bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button className="rounded p-2 text-encre lg:hidden" onClick={() => setMenuOuvert(true)} aria-label="Ouvrir le menu">
              <Icone nom="menu" />
            </button>
            <FilAriane chemin={location.pathname} entrees={visibles} />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight">{nomAffiche}</p>
              <p className="text-xs text-attenue">{role ? ROLES[role] : ''}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primaire text-sm font-bold text-white">
              {initiales(profil?.nom, profil?.prenom) !== '?' ? initiales(profil?.nom, profil?.prenom) : <Icone nom="person" />}
            </div>
          </div>
        </header>

        <main id="contenu" className="mx-auto w-full max-w-[1440px] px-3 py-5 sm:px-6 sm:py-8">
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
    <p className="hidden items-center gap-2 text-sm font-semibold text-encre sm:flex">
      <span className="inline-block h-2 w-2 rounded-full bg-rouge" aria-hidden />
      {actuelle?.libelle ?? 'ipnet-event'}
    </p>
  )
}
