import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { evenementExemple } from '../site/exemple'
import { CarteEvenement } from './CarteEvenement'

describe('CarteEvenement', () => {
  it('utilise le visuel local de secours quand aucun visuel n’a été fourni', () => {
    const evenement = evenementExemple()
    const { container } = render(<MemoryRouter><CarteEvenement evenement={evenement} /></MemoryRouter>)

    expect(container.querySelector('img')?.getAttribute('src')).toBe('/event-card-default.jpg')
  })

  it('préfère le visuel téléversé de l’événement au visuel de secours', () => {
    const evenement = { ...evenementExemple(), aImage: true }
    const { container } = render(<MemoryRouter><CarteEvenement evenement={evenement} /></MemoryRouter>)

    expect(container.querySelector('img')?.getAttribute('src')).toBe('/api/evenements/0/image')
  })
})
