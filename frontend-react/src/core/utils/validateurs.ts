import { z } from 'zod'
import { analyserTelephone } from './telephone'

// Mêmes règles que le backend (RG-01, RG-02, §5.1). Le serveur reste la seule source de vérité.

export const schemaEmail = z
  .string()
  .trim()
  .min(1, "L'e-mail est obligatoire")
  .max(255)
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Adresse e-mail invalide')

/** RG-02 : numéro validé par les métadonnées libphonenumber (même source que le serveur). */
export const schemaTelephone = z
  .string()
  .trim()
  .superRefine((v, ctx) => {
    const a = analyserTelephone(v)
    if (!a.valide) ctx.addIssue({ code: 'custom', message: a.message ?? 'Numéro invalide' })
  })
  .transform((v) => analyserTelephone(v).e164 ?? v)

export const schemaMotDePasse = z
  .string()
  .min(6, 'Au moins 6 caractères')
  .max(128, '128 caractères maximum')

export const schemaTexteObligatoire = (libelle: string, max: number) =>
  z.string().trim().min(1, `${libelle} obligatoire`).max(max, `${max} caractères maximum`)

/** Transforme les erreurs Zod en dictionnaire champ → message. */
export function erreursChamps(resultat: z.ZodSafeParseResult<unknown>): Record<string, string> {
  if (resultat.success) return {}
  const erreurs: Record<string, string> = {}
  for (const issue of resultat.error.issues) {
    const cle = issue.path.join('.')
    if (!erreurs[cle]) erreurs[cle] = issue.message
  }
  return erreurs
}

export function robustesse(motDePasse: string): { score: 0 | 1 | 2 | 3 | 4; libelle: string } {
  let s = 0
  if (motDePasse.length >= 6) s++
  if (/[a-z]/.test(motDePasse) && /[A-Z]/.test(motDePasse)) s++
  if (/\d/.test(motDePasse)) s++
  if (/[^A-Za-z0-9]/.test(motDePasse) || motDePasse.length >= 12) s++
  const libelles = ['Trop court', 'Faible', 'Moyen', 'Bon', 'Excellent']
  const score = (motDePasse.length < 6 ? 0 : s) as 0 | 1 | 2 | 3 | 4
  return { score, libelle: libelles[score] }
}
