import { describe, expect, it } from 'vitest'
import { dansAntiRebond } from './antiRebond'

describe('anti-rebond du scanner', () => {
  it('ignore un doublon seulement pour le même billet et le même événement', () => {
    const dernier = { evenementId: 12, jeton: 'ticket-token', instant: 1_000 }
    expect(dansAntiRebond(dernier, 12, 'ticket-token', 2_000, 4_000)).toBe(true)
    expect(dansAntiRebond(dernier, 13, 'ticket-token', 2_000, 4_000)).toBe(false)
    expect(dansAntiRebond(dernier, 12, 'other-token', 2_000, 4_000)).toBe(false)
    expect(dansAntiRebond(dernier, 12, 'ticket-token', 6_000, 4_000)).toBe(false)
  })
})
