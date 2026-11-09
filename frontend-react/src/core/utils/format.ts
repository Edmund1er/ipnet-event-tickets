const fuseau = undefined // fuseau du navigateur (Lomé : UTC+0)

/** L'API renvoie des LocalDateTime sans fuseau ("2026-12-05T18:30:00"). */
export function versDate(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

export function dateLongue(iso: string | null | undefined): string {
  const d = versDate(iso)
  if (!d) return '—'
  const jour = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: fuseau })
  return `${jour.charAt(0).toUpperCase()}${jour.slice(1)} à ${heure(iso)}`
}

export function dateCourte(iso: string | null | undefined): string {
  const d = versDate(iso)
  if (!d) return '—'
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: fuseau })
}

export function heure(iso: string | null | undefined): string {
  const d = versDate(iso)
  if (!d) return '—'
  const h = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: fuseau })
  return h.replace(':', 'h')
}

export function heureSecondes(iso: string | null | undefined): string {
  const d = versDate(iso)
  if (!d) return '—'
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: fuseau })
}

export function dateHeure(iso: string | null | undefined): string {
  const d = versDate(iso)
  if (!d) return '—'
  return `${dateCourte(iso)} · ${heureSecondes(iso)}`
}

export function montant(valeur: number | string | null | undefined, devise = 'XOF'): string {
  const n = typeof valeur === 'string' ? Number(valeur) : (valeur ?? 0)
  const texte = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n)
  return devise === 'XOF' || devise === 'XAF' ? `${texte} FCFA` : `${texte} ${devise}`
}

/** "2026-12-05T18:30:00" → valeur pour <input type="datetime-local"> */
export function versChampDateHeure(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 16) : ''
}

/** valeur d'<input type="datetime-local"> → LocalDateTime attendu par l'API */
export function depuisChampDateHeure(valeur: string): string {
  return valeur.length === 16 ? `${valeur}:00` : valeur
}

export function initiales(nom?: string | null, prenom?: string | null): string {
  return `${(nom ?? '').charAt(0)}${(prenom ?? '').charAt(0)}`.toUpperCase() || '?'
}

export function tempsRestant(iso: string | null | undefined): string | null {
  const d = versDate(iso)
  if (!d) return null
  const ms = d.getTime() - Date.now()
  if (ms <= 0) return 'expirée'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  return h > 0 ? `${h} h ${m.toString().padStart(2, '0')} min` : `${m} min`
}
