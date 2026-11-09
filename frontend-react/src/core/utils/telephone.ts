import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js/max'
import exemples from 'libphonenumber-js/mobile/examples'
import { useEffect, useState } from 'react'
import { http } from '../api/httpClient'

/**
 * Numéros de téléphone : mêmes métadonnées (libphonenumber) que le serveur.
 * Aucune règle de préfixe n'est codée ici : le plan de numérotation de chaque pays fait foi.
 * Le serveur reste la seule source de vérité (RG-02).
 */

export interface PolitiqueTelephone {
  regionParDefaut: CountryCode
  indicatifParDefaut: number
  regionsAutorisees: CountryCode[]
}

const LIBELLES_TYPE: Record<string, string> = {
  MOBILE: 'mobile',
  FIXED_LINE: 'fixe',
  FIXED_LINE_OR_MOBILE: 'fixe ou mobile',
  VOIP: 'VoIP',
}

const nomsPays = new Intl.DisplayNames(['fr'], { type: 'region' })

export function nomPays(region: string): string {
  try {
    return nomsPays.of(region) ?? region
  } catch {
    return region
  }
}

export interface OptionPays {
  region: CountryCode
  nom: string
  indicatif: string
}

/** Liste des pays (noms français, indicatifs) issue des métadonnées, filtrée par la politique du serveur. */
export function listePays(autorisees: CountryCode[] = []): OptionPays[] {
  const regions = autorisees.length ? autorisees : getCountries()
  return regions
    .map((region) => ({ region, nom: nomPays(region), indicatif: getCountryCallingCode(region) }))
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
}

/** Nombre de chiffres attendus après l'indicatif (déduit du numéro d'exemple des métadonnées, jamais affiché). */
export function longueurNationale(region: CountryCode): number | null {
  const ex = getExampleNumber(region, exemples)
  return ex ? ex.nationalNumber.length : null
}

export interface ResultatTelephone {
  valide: boolean
  e164?: string
  international?: string
  region?: CountryCode
  type?: string
  message?: string
}

/**
 * Analyse une saisie (internationale « +228… » ou nationale dans la région choisie).
 * @param typesAcceptes types de ligne acceptés (ex. ['MOBILE','FIXED_LINE_OR_MOBILE'] pour le Mobile Money)
 */
export function analyserTelephone(saisie: string, region?: CountryCode, typesAcceptes?: string[]): ResultatTelephone {
  const texte = saisie.trim()
  if (!texte) return { valide: false, message: 'Le numéro de téléphone est obligatoire.' }
  const n = parsePhoneNumberFromString(texte, region)
  if (!n) return { valide: false, message: 'Numéro illisible.' }
  const r = (n.country ?? region) as CountryCode | undefined
  if (!n.isValid() || !r) {
    const longueur = r ? longueurNationale(r) : null
    return {
      valide: false,
      message: `Ce numéro n'existe pas dans le plan de numérotation de ${r ? nomPays(r) : 'ce pays'} (+${n.countryCallingCode})${longueur ? ` : ${longueur} chiffres attendus après l'indicatif` : ''}.`,
    }
  }
  const type = n.getType()
  if (typesAcceptes && type && !typesAcceptes.includes(type)) {
    return {
      valide: false,
      message: `Ce numéro est une ligne ${LIBELLES_TYPE[type] ?? 'non reconnue'} : une ligne ${typesAcceptes.filter((t) => !(t === 'FIXED_LINE_OR_MOBILE' && typesAcceptes.includes('MOBILE'))).map((t) => LIBELLES_TYPE[t] ?? t).filter((v, i, a) => a.indexOf(v) === i).join(' ou ')} est attendue.`,
    }
  }
  return { valide: true, e164: n.number, international: n.formatInternational(), region: r, type }
}

/** Mise en forme au fil de la saisie (ex. « 90 11 23 45 »). */
export function formaterSaisie(saisie: string, region: CountryCode): string {
  return new AsYouType(region).input(saisie)
}

export const TYPES_MOBILE_MONEY = ['MOBILE', 'FIXED_LINE_OR_MOBILE']

let politiqueEnCache: Promise<PolitiqueTelephone> | null = null

/** Politique de numérotation du serveur (région par défaut, pays autorisés). */
export function usePolitiqueTelephone(): PolitiqueTelephone | null {
  const [politique, setPolitique] = useState<PolitiqueTelephone | null>(null)
  useEffect(() => {
    politiqueEnCache ??= http
      .get<PolitiqueTelephone>('/referentiels/telephone')
      .then((r) => r.data)
      .catch((e) => {
        politiqueEnCache = null
        throw e
      })
    let actif = true
    politiqueEnCache.then((p) => actif && setPolitique(p)).catch(() => undefined)
    return () => {
      actif = false
    }
  }, [])
  return politique
}
