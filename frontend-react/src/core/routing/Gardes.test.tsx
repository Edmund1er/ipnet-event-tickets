import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { accueilPour, RequireAnonyme, RequireRole } from './Gardes'

const etat = vi.hoisted(() => ({ valeur: { chargement: false, session: null as unknown } }))
vi.mock('../auth/AuthContext', () => ({ useAuth: () => etat.valeur }))

function rendre(chemin: string, element: ReactNode) {
  return render(
    <MemoryRouter initialEntries={[chemin]}>
      <Routes>
        <Route path="/connexion" element={<p>page connexion</p>} />
        <Route path="/verification" element={<p>page verification</p>} />
        <Route path="/" element={<p>accueil participant</p>} />
        <Route path="/admin" element={<p>tableau de bord admin</p>} />
        <Route path="/admin/secret" element={element} />
        <Route path="/profil" element={element} />
      </Routes>
    </MemoryRouter>,
  )
}

const session = (role: string, emailVerifie = true) => ({ accessToken: 't', expireDans: 900, utilisateurId: 1, role, emailVerifie })

describe('garde de route RequireRole (§9)', () => {
  it('renvoie un visiteur anonyme vers la connexion', () => {
    etat.valeur = { chargement: false, session: null }
    rendre('/admin/secret', <RequireRole roles={['ADMIN']}>secret</RequireRole>)
    expect(screen.getByText('page connexion')).toBeInTheDocument()
  })

  it("n'affiche jamais une page protégée à un compte dont l'e-mail n'est pas vérifié", () => {
    etat.valeur = { chargement: false, session: session('PARTICIPANT', false) }
    rendre('/admin/secret', <RequireRole roles={['PARTICIPANT']}>secret</RequireRole>)
    expect(screen.getByText('page verification')).toBeInTheDocument()
    expect(screen.queryByText('secret')).not.toBeInTheDocument()
  })

  it("refuse l'espace administrateur à un participant et le renvoie à son accueil", () => {
    etat.valeur = { chargement: false, session: session('PARTICIPANT') }
    rendre('/admin/secret', <RequireRole roles={['ADMIN']}>secret</RequireRole>)
    expect(screen.getByText('accueil participant')).toBeInTheDocument()
  })

  it("laisse passer l'administrateur", () => {
    etat.valeur = { chargement: false, session: session('ADMIN') }
    rendre('/admin/secret', <RequireRole roles={['ADMIN']}>secret</RequireRole>)
    expect(screen.getByText('secret')).toBeInTheDocument()
  })

  it('RequireAnonyme redirige un utilisateur connecté vers son espace', () => {
    etat.valeur = { chargement: false, session: session('ADMIN') }
    rendre('/profil', <RequireAnonyme>formulaire</RequireAnonyme>)
    expect(screen.getByText('tableau de bord admin')).toBeInTheDocument()
  })

  it("choisit l'accueil selon le rôle", () => {
    expect(accueilPour('ADMIN')).toBe('/admin')
    expect(accueilPour('SCANNER')).toBe('/controle/scanner')
    expect(accueilPour('PARTICIPANT')).toBe('/')
  })
})
