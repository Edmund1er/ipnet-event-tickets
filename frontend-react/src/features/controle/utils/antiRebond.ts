export interface ScanRecent {
  evenementId: number
  jeton: string
  instant: number
}

/** Un doublon ne doit être ignoré que pour le même billet et le même événement. */
export function dansAntiRebond(dernier: ScanRecent | null, evenementId: number, jeton: string, maintenant: number, delai: number): boolean {
  return !!dernier
    && dernier.evenementId === evenementId
    && dernier.jeton === jeton
    && maintenant >= dernier.instant
    && maintenant - dernier.instant < delai
}
