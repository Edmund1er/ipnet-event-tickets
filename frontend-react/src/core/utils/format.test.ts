import { describe, expect, it } from 'vitest'
import { dateCourte, dateLongue, depuisChampDateHeure, heure, initiales, montant, versChampDateHeure, versDate } from './format'

describe('formatage', () => {
  it('convertit les dates de l’API et du champ datetime-local sans décalage', () => {
    expect(versChampDateHeure('2026-12-05T18:30:00')).toBe('2026-12-05T18:30')
    expect(depuisChampDateHeure('2026-12-05T18:30')).toBe('2026-12-05T18:30:00')
    expect(depuisChampDateHeure('2026-12-05T18:30:15')).toBe('2026-12-05T18:30:15')
    expect(versChampDateHeure(null)).toBe('')
  })

  it('formate les dates en français et gère les valeurs vides', () => {
    expect(dateLongue('2026-12-05T18:30:00')).toMatch(/Samedi 5 décembre 2026 à 18h30/)
    expect(dateCourte('2026-12-05T18:30:00')).toContain('2026')
    expect(heure('2026-12-05T18:30:00')).toBe('18h30')
    expect(dateLongue(null)).toBe('—')
    expect(versDate('pas une date')).toBeNull()
  })

  it('formate les montants en FCFA', () => {
    expect(montant(5000)).toMatch(/5\s000 FCFA/)
    expect(montant('12000', 'EUR')).toMatch(/12\s000 EUR/)
    expect(montant(null)).toContain('0')
  })

  it('calcule les initiales', () => {
    expect(initiales('Kossi', 'Ama')).toBe('KA')
    expect(initiales(null, null)).toBe('?')
  })
})
