import { fireEvent, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { Evenement } from '../../../core/api/types'
import { CarteEvenement } from './CarteEvenement'

const evenementExemple = (): Evenement => ({ id: 0, titre: 'Exemple', description: null, dateDebut: '2026-12-19T07:00:00', lieu: 'Avépozo', prix: 2000, devise: 'XOF', capacite: 100, placesReservees: 0, placesRestantes: 100, statut: 'PUBLIE', aImage: false })

describe('CarteEvenement', () => {
  it('affiche une composition festive locale quand aucune affiche n’a été fournie', () => {
    const evenement = evenementExemple()
    const { container } = render(<MemoryRouter><CarteEvenement evenement={evenement} /></MemoryRouter>)

    expect(container.querySelector('[data-vibe-art]')).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('a')?.getAttribute('href')).toBe('/evenements/0')
  })

  it('préfère l’affiche téléversée et conserve le visuel de secours si elle ne charge pas', () => {
    const evenement = { ...evenementExemple(), aImage: true }
    const { container } = render(<MemoryRouter><CarteEvenement evenement={evenement} /></MemoryRouter>)
    const affiche = container.querySelector('img')

    expect(affiche?.getAttribute('src')).toBe('/api/evenements/0/image')
    fireEvent.error(affiche!)
    expect(container.querySelector('[data-vibe-art]')).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })
})
