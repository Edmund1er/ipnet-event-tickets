import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'

/** Saisie d'un code à 6 chiffres (une case par chiffre, collage accepté). */
export function SaisieCode({ valeur, surChangement }: { valeur: string; surChangement: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const chiffres = Array.from({ length: 6 }, (_, i) => valeur[i] ?? '')

  function saisir(i: number, valeurSaisie: string) {
    const entrees = valeurSaisie.replace(/\D/g, '')
    if (!entrees) {
      const suivant = [...chiffres]
      suivant[i] = ''
      surChangement(suivant.join('').slice(0, 6))
      return
    }
    const entreesPlacees = entrees.slice(0, 6 - i)
    const suivant = [...chiffres]
    for (const [offset, chiffre] of [...entreesPlacees].entries()) suivant[i + offset] = chiffre
    surChangement(suivant.join('').slice(0, 6))
    refs.current[Math.min(i + entreesPlacees.length, 5)]?.focus()
  }

  function touche(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); refs.current[i - 1]?.focus() }
    if (e.key === 'ArrowRight' && i < 5) { e.preventDefault(); refs.current[i + 1]?.focus() }
    if (e.key === 'Backspace') {
      if (chiffres[i]) {
        e.preventDefault()
        saisir(i, '')
      } else if (i > 0) {
        e.preventDefault()
        refs.current[i - 1]?.focus()
      }
    }
  }

  function coller(e: ClipboardEvent) {
    const code = e.clipboardData.getData('text').replace(/\D/g, '')
    const index = e.target instanceof HTMLInputElement ? Math.max(0, refs.current.indexOf(e.target)) : 0
    if (code.length) {
      e.preventDefault()
      saisir(index, code)
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
            maxLength={i === 0 ? 6 : 1}
            value={d}
            onChange={(e) => saisir(i, e.target.value)}
            onKeyDown={(e) => touche(i, e)}
            className="chiffres h-14 w-12 rounded-lg border-[1.5px] border-bordure text-center font-titre text-2xl font-bold text-primaire outline-none focus:border-primaire focus:ring-2 focus:ring-primaire/20 sm:w-14"
          />
        ))}
      </div>
    </fieldset>
  )
}
