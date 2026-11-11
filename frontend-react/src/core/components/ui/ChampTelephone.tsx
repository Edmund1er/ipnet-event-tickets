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

  // Synchronisation avec la valeur externe (si le parent met à jour la valeur ou réinitialise le formulaire)
  useEffect(() => {
    if (!valeur) {
      setSaisie('')
      return
    }
    const parsed = parsePhoneNumberFromString(valeur)
    if (parsed) {
      setSaisie(parsed.formatNational())
      if (parsed.country && parsed.country !== region) {
        setRegion(parsed.country as CountryCode)
      }
    }
  }, [valeur]) // eslint-disable-line react-hooks/exhaustive-deps

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
    <div className="w-full min-w-0">
      <label htmlFor={id} className="etiquette">
        {libelle}
      </label>
      <div className="flex w-full min-w-0 items-stretch rounded-xl border-[1.5px] border-bordure bg-white transition-colors focus-within:border-primaire focus-within:ring-2 focus-within:ring-primaire/20">
        <select
          aria-label="Pays de l'indicatif"
          className="h-12 w-24 shrink-0 cursor-pointer border-0 border-r border-bordure bg-surface/60 px-1.5 text-xs font-medium text-encre outline-none hover:bg-surface"
          value={regionActive}
          onChange={(e) => {
            const r = e.target.value as CountryCode
            setRegion(r)
            emettre(saisie, r)
          }}
          title={pays.find((p) => p.region === regionActive)?.nom ?? ''}
        >
          {pays.map((p) => (
            <option key={p.region} value={p.region}>
              {p.region} +{p.indicatif}
            </option>
          ))}
        </select>
        <div className="relative min-w-0 flex-1">
          <input
            id={id}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className="h-12 w-full min-w-0 border-0 bg-transparent px-3.5 pr-10 text-sm text-encre outline-none placeholder:text-attenue/70 sm:text-base"
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
            <Icone nom="check_circle" pleine taille={20} className="pointer-events-none absolute right-3 top-3.5 text-succes" />
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
