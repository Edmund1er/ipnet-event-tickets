import { describe, expect, it } from 'vitest'
import { evenementExemple } from './exemple'
import { construireContenu } from './contenu'
import { appliquerConference } from './modeles/conference'
import { actionHero } from './modeles/outils'
import { PAGE_VIDE, type CreneauConfig, type PageConfig } from './types'

function rendreProgramme(nombre: number) {
  const creneaux: CreneauConfig[] = Array.from({ length: nombre }, (_, i) => ({
    jour: '2026-12-05',
    debut: `${String(9 + i).padStart(2, '0')}:00`,
    fin: `${String(10 + i).padStart(2, '0')}:00`,
    titre: `Session dynamique ${i + 1}`,
  }))
  const page: PageConfig = {
    version: 1,
    sections: [{ id: 'programme', type: 'PROGRAMME', actif: true, titre: 'Programme', creneaux }],
  }
  const contenu = construireContenu(evenementExemple(), [], page, (nom) => `/images/${nom}`)
  const doc = new DOMParser().parseFromString(`
    <section id="schedule">
      <div class="section-title"><h2></h2></div>
      <ul class="nav-tabs"><li class="nav-item"><a></a></li></ul>
      <div role="tabpanel"><div class="schedule-item"><time></time><h4></h4><p></p><div class="speaker"><img src="" /></div></div></div>
    </section>
  `, 'text/html')
  appliquerConference(doc, contenu)
  return doc
}

describe('visuels et actions des pages événement', () => {
  it('génère une affiche SVG thématique et garde la vraie image quand elle existe', () => {
    const sansAffiche = construireContenu(evenementExemple(), [], PAGE_VIDE, (nom) => `/images/${nom}`)
    const avecAffiche = construireContenu({ ...evenementExemple(), aImage: true }, [], PAGE_VIDE, (nom) => `/images/${nom}`)

    expect(sansAffiche.imageHero?.startsWith('data:image/svg+xml,')).toBe(true)
    expect(sansAffiche.imageHero).not.toContain('event-card-default.jpg')
    expect(avecAffiche.imageHero).toBe('/api/evenements/0/image')

    const visuelPlage = construireContenu({ ...evenementExemple(), modele: 'RENCONTRE' as const }, [], PAGE_VIDE, (nom) => `/images/${nom}`)
    const visuelNature = construireContenu({ ...evenementExemple(), modele: 'ATELIER' as const }, [], PAGE_VIDE, (nom) => `/images/${nom}`)
    expect(visuelPlage.imageHero).not.toBe(visuelNature.imageHero)
  })

  it('remplace le hero de démonstration et ajoute le CTA réel au modèle Concert', () => {
    const contenu = construireContenu(evenementExemple(), [], PAGE_VIDE, (nom) => `/images/${nom}`)
    const doc = new DOMParser().parseFromString('<section id="hero"><img src="/event-card-default.jpg"><div class="container text-center"><h2></h2><p></p></div></section>', 'text/html')

    appliquerConference(doc, contenu)

    expect(doc.querySelector('#hero > img')).toBeNull()
    expect(doc.querySelector('.ipnet-hero-cta')?.getAttribute('data-ipnet')).toBe('reserver')
  })

  it('indique la date exacte d’un pass journée dans la billetterie', () => {
    const base = evenementExemple()
    const programme = { ...base, id: 30, type: 'CADRE' as const, dateFin: '2026-11-17T23:00:00' }
    const pass = { ...base, id: 31, type: 'PASS' as const, parentId: 30, passPortee: 'JOURNEE' as const, passJour: '2026-11-16', titre: 'Pass du lundi' }
    const contenu = construireContenu(programme, [pass], PAGE_VIDE, (nom) => `/images/${nom}`)

    expect(contenu.offres[0].points[0]).toContain('lundi 16 novembre')
  })

  it('utilise un lien de programme pour l’accès libre et le pont de réservation pour un billet', () => {
    const evenement = evenementExemple()
    const payant = construireContenu(evenement, [], PAGE_VIDE, (nom) => `/images/${nom}`)
    const libre = construireContenu({ ...evenement, accesLibre: true }, [], PAGE_VIDE, (nom) => `/images/${nom}`)
    const zonePayante = document.createElement('div')
    const zoneLibre = document.createElement('div')

    actionHero(document, zonePayante, payant)
    actionHero(document, zoneLibre, libre)

    expect(zonePayante.querySelector('a')?.getAttribute('data-ipnet')).toBe('reserver')
    expect(zoneLibre.querySelector('a')?.getAttribute('href')).toBe('#billets')
    expect(zoneLibre.querySelector('a')).not.toHaveAttribute('data-ipnet')
  })
})

describe('programme dynamique des pages événement', () => {
  it('conserve les deux années quand un programme traverse une année civile', () => {
    const evenement = { ...evenementExemple(), type: 'CADRE' as const, dateDebut: '2026-11-15T10:00:00', dateFin: '2027-11-20T18:00:00' }
    const contenu = construireContenu(evenement, [], PAGE_VIDE, (nom) => `/images/${nom}`)
    expect(contenu.dateTexte).toContain('2026')
    expect(contenu.dateTexte).toContain('2027')
  })

  it('résout les blocs de cartes, images et thèmes par section', () => {
    const config: PageConfig = {
      version: 1,
      apparence: { couleurEntete: '#102030', couleurTexteEntete: '#ffffff' },
      sections: [{
        id: 'atouts', type: 'CARTES', actif: true, titre: 'À découvrir', colonnes: 4,
        couleurFond: '#f7f7f7', couleurCarte: '#ffffff', couleurBouton: '#2563eb',
        elements: [{ id: 'carte-1', titre: 'Atelier', texte: 'Découverte pratique', image: 'atelier.webp' }],
      }],
    }
    const contenu = construireContenu(evenementExemple(), [], config, (nom) => `/images/${nom}`)

    expect(contenu.apparencePage.couleurEntete).toBe('#102030')
    expect(contenu.stylesSections).toContainEqual(expect.objectContaining({ id: 'atouts', couleurFond: '#f7f7f7', couleurCarte: '#ffffff' }))
    expect(contenu.blocs).toContainEqual(expect.objectContaining({
      id: 'atouts', type: 'CARTES', colonnes: 4,
      elements: [{ id: 'carte-1', titre: 'Atelier', texte: 'Découverte pratique', image: '/images/atelier.webp' }],
    }))
  })

  it.each([2, 6])('affiche exactement les %i créneaux configurés et leurs vrais titres', (nombre) => {
    const doc = rendreProgramme(nombre)
    const lignes = [...doc.querySelectorAll('.schedule-item')]
    expect(lignes).toHaveLength(nombre)
    expect(lignes.map((ligne) => ligne.querySelector('h4')?.textContent)).toEqual(
      Array.from({ length: nombre }, (_, i) => `Session dynamique ${i + 1}`),
    )
  })
})
