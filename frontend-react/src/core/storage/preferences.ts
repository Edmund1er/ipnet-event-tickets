/** Préférences locales non sensibles (ex. événement choisi au poste de scan). Aucun jeton n'est stocké ici. */
const PREFIXE = 'ipnet.'

export const preferences = {
  lire(cle: string): string | null {
    try {
      return localStorage.getItem(PREFIXE + cle)
    } catch {
      return null
    }
  },
  ecrire(cle: string, valeur: string | null) {
    try {
      if (valeur === null) localStorage.removeItem(PREFIXE + cle)
      else localStorage.setItem(PREFIXE + cle, valeur)
    } catch {
      /* stockage indisponible : la préférence n'est simplement pas conservée */
    }
  },
}
