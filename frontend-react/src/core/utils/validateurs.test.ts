import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { erreursChamps, robustesse, schemaEmail, schemaMotDePasse, schemaTelephone, schemaTexteObligatoire } from './validateurs'

describe('schémas Zod (mêmes règles que le backend)', () => {
  it('accepte et nettoie une adresse e-mail valide, refuse les autres (RG-01)', () => {
    expect(schemaEmail.parse('  parent@test.tg ')).toBe('parent@test.tg')
    expect(schemaEmail.safeParse('pas-un-email').success).toBe(false)
    expect(schemaEmail.safeParse('a@b').success).toBe(false)
    expect(schemaEmail.safeParse('').success).toBe(false)
  })

  it('exige 12 caractères minimum pour le mot de passe (§5.1)', () => {
    expect(schemaMotDePasse.safeParse('court').success).toBe(false)
    expect(schemaMotDePasse.safeParse('MotDePasseOk12').success).toBe(true)
    expect(schemaMotDePasse.safeParse('x'.repeat(129)).success).toBe(false)
  })

  it('convertit un téléphone valide au format E.164 et refuse un numéro trop court (RG-02)', () => {
    expect(schemaTelephone.safeParse('+2281234').success).toBe(false)
    expect(schemaTelephone.safeParse('').success).toBe(false)
    expect(schemaTelephone.parse('+228 90 11 23 45')).toBe('+22890112345')
  })

  it('texte obligatoire borné', () => {
    const s = schemaTexteObligatoire('Nom', 5)
    expect(s.safeParse('  ').success).toBe(false)
    expect(s.safeParse('Kossi').success).toBe(true)
    expect(s.safeParse('Trop long').success).toBe(false)
  })

  it('erreursChamps renvoie un message par champ', () => {
    const r = z.object({ email: schemaEmail, nom: schemaTexteObligatoire('Nom', 10) }).safeParse({ email: 'x', nom: '' })
    const e = erreursChamps(r)
    expect(Object.keys(e).sort()).toEqual(['email', 'nom'])
    expect(erreursChamps(z.string().safeParse('ok'))).toEqual({})
  })

  it('évalue la robustesse du mot de passe', () => {
    expect(robustesse('court').score).toBe(0)
    expect(robustesse('motdepasseminuscule').score).toBeGreaterThanOrEqual(1)
    expect(robustesse('MotDePasse2026!Fort').score).toBe(4)
  })
})
