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
    expect(premiere).toContain('Nuit des Vibes — Lomé')
    expect(premiere).not.toContain('window.hacked')
    expect(seconde).toContain('Deuxième aperçu')
    expect(seconde).not.toContain('Nuit des Vibes — Lomé')
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

  it('affiche un CTA du hero et une réservation fixe au mobile sans afficher l’image de démo', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<!doctype html><html lang="en"><head></head><body><main><div class="slider_area"><div class="single_slider"><div class="slider_text"><span>Demo</span><h3>Demo</h3><p>Demo</p></div></div></div></main></body></html>',
    })
    vi.stubGlobal('fetch', fetchMock)
    const contenu = construireContenu(evenementExemple(), [], PAGE_VIDE, (nom) => `/images/${nom}`)
    const page = await genererPage('SOIREE', contenu, 'https://events.test')

    expect(page).toContain('class="ipnet-hero-cta"')
    expect(page).toContain('data-ipnet="reserver"')
    expect(page).toContain('class="ipnet-mobile-ticket-cta"')
    expect(page).toContain('data:image/svg+xml,')
    expect(page).not.toContain('src="/event-card-default.jpg"')
  })
})
