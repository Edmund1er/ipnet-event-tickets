import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InscriptionPage } from './InscriptionPage'
import { VerificationInscriptionPage } from './VerificationInscriptionPage'

const service = vi.hoisted(() => ({
  filieres: vi.fn(),
  categories: vi.fn(),
  inscription: vi.fn(),
  confirmerInscription: vi.fn(),
  renvoyerCodeInscription: vi.fn(),
}))
const ouvrir = vi.hoisted(() => vi.fn())

vi.mock('../services/authService', () => ({ authService: service }))
vi.mock('../../../core/auth/AuthContext', () => ({ useAuth: () => ({ ouvrir }) }))
vi.mock('../../../core/components/ui/ChampTelephone', () => ({
  ChampTelephone: ({ valeur, surChangement }: { valeur: string; surChangement: (v: string) => void }) => (
    <input aria-label="Téléphone" value={valeur} onChange={(e) => surChangement(e.target.value)} />
  ),
}))

function Etat() {
  const l = useLocation()
  return <pre data-testid="etat">{l.pathname + JSON.stringify(l.state)}</pre>
}

function monter(chemin = '/inscription', state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: chemin, state }]}>
      <Routes>
        <Route path="/inscription" element={<InscriptionPage />} />
        <Route path="/inscription/verification" element={<VerificationInscriptionPage />} />
        <Route path="/" element={<p>accueil</p>} />
      </Routes>
      <Etat />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  service.filieres.mockResolvedValue([{ id: 1, libelle: 'Génie Logiciel' }])
  service.categories.mockResolvedValue([{ id: 2, code: 'PARENT', libelle: "Parent d'élève" }])
})

describe('inscription en deux temps', () => {
  it("n'a plus de champ adresse et propose l'année en liste", async () => {
    monter()
    await userEvent.click(await screen.findByText('Étudiant interne'))
    expect(screen.queryByLabelText('Adresse')).not.toBeInTheDocument()
    expect(screen.getByLabelText("Année d'inscription en L1").tagName).toBe('SELECT')
  })

  it('envoie la demande puis passe à la saisie du code, sans ouvrir de session', async () => {
    service.inscription.mockResolvedValue({ email: 'a@test.tg', codeValideMinutes: 5, message: 'ok' })
    monter()
    await userEvent.click(await screen.findByText('Visiteur externe'))
    await userEvent.type(screen.getByLabelText('Nom'), 'Kossi')
    await userEvent.type(screen.getByLabelText('Prénom'), 'Ama')
    await userEvent.type(screen.getByLabelText('E-mail'), 'a@test.tg')
    await userEvent.type(screen.getByLabelText('Téléphone'), '+22890112345')
    await userEvent.selectOptions(screen.getByLabelText('Catégorie'), '2')
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'MotDePasseOk12')
    await userEvent.type(screen.getByLabelText('Confirmation'), 'MotDePasseOk12')
    await userEvent.click(screen.getByRole('button', { name: /créer mon compte/i }))

    await waitFor(() => expect(service.inscription).toHaveBeenCalled())
    const corps = service.inscription.mock.calls[0][0]
    expect(corps).not.toHaveProperty('adresse')
    expect(corps.typeProfil).toBe('VISITEUR')
    expect(ouvrir).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.getByTestId('etat').textContent).toContain('/inscription/verification'))
  })

  it("refuse la page de code sans demande d'inscription préalable", () => {
    monter('/inscription/verification')
    const t = screen.getByTestId('etat').textContent ?? ''
    expect(t.startsWith('/inscription')).toBe(true)
    expect(t).not.toContain('/inscription/verification')
  })

  it("crée le compte uniquement quand le code est validé, et affiche l'erreur sinon", async () => {
    service.confirmerInscription.mockRejectedValueOnce(new Error('Code incorrect (4 essai(s) restant(s)).'))
    service.confirmerInscription.mockResolvedValueOnce({ accessToken: 't', role: 'PARTICIPANT', emailVerifie: true })
    monter('/inscription/verification', { email: 'a@test.tg', validite: 5 })

    await userEvent.click(screen.getAllByLabelText(/Chiffre/)[0])
    await userEvent.keyboard('000000')
    await userEvent.click(screen.getByRole('button', { name: /valider et créer/i }))
    await waitFor(() => expect(service.confirmerInscription).toHaveBeenCalledWith('a@test.tg', '000000'))
    expect(ouvrir).not.toHaveBeenCalled()

    await userEvent.click(screen.getAllByLabelText(/Chiffre/)[0])
    await userEvent.keyboard('123456')
    await userEvent.click(screen.getByRole('button', { name: /valider et créer/i }))
    await waitFor(() => expect(ouvrir).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.getByText('accueil')).toBeInTheDocument())
  })

  it('exige les 6 chiffres avant tout envoi', async () => {
    monter('/inscription/verification', { email: 'a@test.tg', validite: 5 })
    await userEvent.click(screen.getByRole('button', { name: /valider et créer/i }))
    expect(service.confirmerInscription).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('6 chiffres')
  })
})
