import { describe, expect, it } from 'vitest'
import { evenementExemple } from './exemple'
import { construireContenu } from './contenu'
import { appliquerConference } from './modeles/conference'
import type { CreneauConfig, PageConfig } from './types'

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

describe('programme dynamique des pages événement', () => {
  it.each([2, 6])('affiche exactement les %i créneaux configurés et leurs vrais titres', (nombre) => {
    const doc = rendreProgramme(nombre)
    const lignes = [...doc.querySelectorAll('.schedule-item')]
    expect(lignes).toHaveLength(nombre)
    expect(lignes.map((ligne) => ligne.querySelector('h4')?.textContent)).toEqual(
      Array.from({ length: nombre }, (_, i) => `Session dynamique ${i + 1}`),
    )
  })
})
