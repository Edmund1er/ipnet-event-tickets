import { useEffect, useId, useMemo, useState } from 'react'
import type { CountryCode } from 'libphonenumber-js/max'
import { parsePhoneNumberFromString } from 'libphonenumber-js/max'
import { analyserTelephone, formaterSaisie, listePays, nomPays, usePolitiqueTelephone } from '../../utils/telephone'
import { Icone } from './Icone'

interface Props {
  libelle?: string
  /** Valeur courante (E.164 si valide, sinon saisie brute préfixée de l'indicatif). */
  valeur: string
  surChangement: (valeur: string) => void
  erreur?: string
  aide?: string
  /** Types de ligne acceptés (ex. Mobile Money : MOBILE, FIXED_LINE_OR_MOBILE). */
  typesAcceptes?: string[]
}

/**
 * Saisie d'un numéro (RG-02) : pays et indicatifs issus des métadonnées libphonenumber,
 * région par défaut fournie par le serveur, mise en forme et validation au fil de la frappe.
 */
export function ChampTelephone({ libelle = 'Téléphone', valeur, surChangement, erreur, aide, typesAcceptes }: Props) {
  const id = useId()
  const politique = usePolitiqueTelephone()
  const pays = useMemo(() => listePays(politique?.regionsAutorisees ?? []), [politique])
  const initial = useMemo(() => (valeur ? parsePhoneNumberFromString(valeur) : undefined), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [region, setRegion] = useState<CountryCode | null>((initial?.country as CountryCode) ?? null)
  const [saisie, setSaisie] = useState(initial ? initial.formatNational() : '')
  const [touche, setTouche] = useState(false)

  // Région par défaut : TG (Togo) par défaut ou celle du serveur
  const regionActive: CountryCode = region ?? politique?.regionParDefaut ?? 'TG'

  // Si la politique charge après le montage et qu'aucune région n'avait été choisie
  useEffect(() => {
    if (!region && politique?.regionParDefaut) {
      setRegion(politique.regionParDefaut)
    }
  }, [politique, region])

  const analyse = saisie.trim() ? analyserTelephone(saisie, regionActive, typesAcceptes) : null

  function emettre(texte: string, r: CountryCode) {
    const a = analyserTelephone(texte, r, typesAcceptes)
    if (a.valide && a.e164) {
      surChangement(a.e164)
    } else {
      const chiffres = texte.replace(/[^\d+]/g, '')
      surChangement(chiffres.startsWith('+') ? chiffres : chiffres ? `+${listePays([r])[0]?.indicatif ?? ''}${chiffres.replace(/^0+/, '')}` : '')
    }
  }

  const messageLocal = touche && analyse && !analyse.valide ? analyse.message : undefined
  const message = erreur ?? messageLocal

  return (
    <div>
      <label htmlFor={id} className="etiquette">
        {libelle}
      </label>
      <div className="flex gap-2">
        <select
          aria-label="Pays de l'indicatif"
          className="champ !w-32 shrink-0 !px-2 text-xs sm:!w-36 sm:text-sm"
          value={regionActive}
          onChange={(e) => {
            const r = e.target.value as CountryCode
            setRegion(r)
            emettre(saisie, r)
          }}
        >
          {pays.map((p) => (
            <option key={p.region} value={p.region}>
              {p.nom} (+{p.indicatif})
            </option>
          ))}
        </select>
        <div className="relative min-w-0 flex-1">
          <input
            id={id}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={`champ w-full pr-10 ${message ? '!border-erreur' : analyse?.valide ? '!border-succes' : ''}`}
            value={saisie}
            placeholder="Ex: 90 12 34 56"
            aria-invalid={!!message || undefined}
            aria-describedby={`${id}-info`}
            onBlur={() => setTouche(true)}
            onChange={(e) => {
              const texte = e.target.value
              // Saisie internationale collée : la région suit le numéro
              const n = texte.trim().startsWith('+') ? parsePhoneNumberFromString(texte) : undefined
              const r = (n?.country as CountryCode) ?? regionActive
              if (n?.country && n.country !== regionActive) setRegion(r)
              const formate = texte.length < saisie.length ? texte : formaterSaisie(n?.country ? n.nationalNumber : texte, r)
              setSaisie(formate)
              emettre(n?.country ? n.number : formate, r)
            }}
          />
          {analyse?.valide && (
            <Icone nom="check_circle" pleine taille={20} className="absolute right-3 top-3.5 text-succes" />
          )}
        </div>
      </div>
      <p id={`${id}-info`} role={message ? 'alert' : undefined} className={`mt-1.5 text-[13px] ${message ? 'text-erreur' : 'text-attenue'}`}>
        {message ??
          (analyse?.valide
            ? `${analyse.international} — ligne ${analyse.type === 'MOBILE' ? 'mobile' : analyse.type === 'FIXED_LINE' ? 'fixe' : 'fixe ou mobile'} (${nomPays(analyse.region!)})`
            : aide ?? (regionActive ? `Numéro ${nomPays(regionActive)} sans l'indicatif, ou numéro international avec « + ».` : ''))}
      </p>
    </div>
  )
}
