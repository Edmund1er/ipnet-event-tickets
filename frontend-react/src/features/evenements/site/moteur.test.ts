import { afterEach, describe, expect, it, vi } from 'vitest'
import { construireContenu } from './contenu'
import { evenementExemple } from './exemple'
import { genererPage } from './moteur'
import { PAGE_VIDE, type PageConfig } from './types'

afterEach(() => vi.unstubAllGlobals())

describe('moteur de pages événement', () => {
  it('clone le squelette sans fuite entre prévisualisations et refuse les couleurs CSS invalides', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<!doctype html><html lang="en"><head></head><body><main><section id="hero"><h2>Demo</h2><p>Demo</p></section><div id="preloader"></div></main></body></html>',
    })
    vi.stubGlobal('fetch', fetchMock)
    const base = construireContenu(evenementExemple(), [], PAGE_VIDE, (nom) => `/images/${nom}`)

    const premiere = await genererPage('CONFERENCE', { ...base, couleurPrincipale: 'red;}</style><script>window.hacked=1</script>' }, 'https://events.test')
    const seconde = await genererPage('CONFERENCE', { ...base, titre: 'Deuxième aperçu' }, 'https://events.test')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(premiere).toContain('<html lang="fr">')
    expect(premiere).toContain('Nuit de la rentrée IPNET')
    expect(premiere).not.toContain('window.hacked')
    expect(seconde).toContain('Deuxième aperçu')
    expect(seconde).not.toContain('Nuit de la rentrée IPNET')
    expect(premiere).not.toContain('id="preloader"')

    const blocs: PageConfig = {
      version: 1,
      sections: [{ id: 'cartes-1', type: 'CARTES', actif: true, titre: 'Activités', colonnes: 3, couleurFond: '#f1f5f9', couleurCarte: '#ffffff', couleurTexte: '#172033', elements: [{ id: 'item-1', titre: 'Atelier pratique', texte: 'Création en groupe' }] }],
    }
    const pageAvecBlocs = await genererPage('CONFERENCE', construireContenu(evenementExemple(), [], blocs, (nom) => `/images/${nom}`), 'https://events.test')
    expect(pageAvecBlocs).toContain('id="cartes-1"')
    expect(pageAvecBlocs).toContain('Atelier pratique')
    expect(pageAvecBlocs).toContain('Création en groupe')
    expect(pageAvecBlocs).toContain('data-ipnet-section')
  })
})
