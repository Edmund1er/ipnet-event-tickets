import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'

/** Saisie d'un code à 6 chiffres (une case par chiffre, collage accepté). */
export function SaisieCode({ valeur, surChangement }: { valeur: string; surChangement: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const chiffres = Array.from({ length: 6 }, (_, i) => valeur[i] ?? '')

  function saisir(i: number, v: string) {
    const c = v.replace(/\D/g, '').slice(-1)
    const suivant = chiffres.map((d, j) => (j === i ? c : d)).join('')
    surChangement(suivant.slice(0, 6))
    if (c && i < 5) refs.current[i + 1]?.focus()
  }

  function touche(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !chiffres[i] && i > 0) refs.current[i - 1]?.focus()
  }

  function coller(e: ClipboardEvent) {
    const code = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (code.length) {
      e.preventDefault()
      surChangement(code)
      refs.current[Math.min(code.length, 5)]?.focus()
    }
  }

  return (
    <fieldset>
      <legend className="sr-only">Code de vérification</legend>
      <div className="flex justify-between gap-2" onPaste={coller}>
        {chiffres.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el
            }}
            aria-label={`Chiffre ${i + 1}`}
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={d}
            onChange={(e) => saisir(i, e.target.value)}
            onKeyDown={(e) => touche(i, e)}
            className="chiffres h-14 w-12 rounded border-[1.5px] border-bordure text-center font-titre text-2xl font-bold text-primaire outline-none focus:border-primaire focus:ring-2 focus:ring-primaire/20 sm:w-14"
          />
        ))}
      </div>
    </fieldset>
  )
}
