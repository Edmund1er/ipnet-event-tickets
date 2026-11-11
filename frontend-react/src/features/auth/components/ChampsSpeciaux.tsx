import { useId } from 'react'
import { robustesse } from '../../../core/utils/validateurs'

export { ChampTelephone } from '../../../core/components/ui/ChampTelephone'

export function ChampMotDePasse({
  libelle = 'Mot de passe',
  valeur,
  surChangement,
  erreur,
  avecJauge = false,
  autoComplete = 'current-password',
}: {
  libelle?: string
  valeur: string
  surChangement: (v: string) => void
  erreur?: string
  avecJauge?: boolean
  autoComplete?: string
}) {
  const id = useId()
  const r = robustesse(valeur)
  const couleurs = ['bg-erreur', 'bg-erreur', 'bg-alerte', 'bg-primaire', 'bg-succes']
  return (
    <div>
      <label htmlFor={id} className="etiquette">
        {libelle}
      </label>
      <div className="relative">
        <input
          id={id}
          type="password"
          autoComplete={autoComplete}
          className={`champ ${erreur ? '!border-erreur' : ''}`}
          value={valeur}
          aria-invalid={!!erreur || undefined}
          onChange={(e) => surChangement(e.target.value)}
        />
      </div>
      {avecJauge && valeur.length > 0 && (
        <div className="mt-2">
          <div className="flex gap-1" aria-hidden>
            {[1, 2, 3, 4].map((n) => (
              <span key={n} className={`h-1.5 flex-1 rounded ${r.score >= n ? couleurs[r.score] : 'bg-bordure'}`} />
            ))}
          </div>
          <p className="mt-1 text-xs text-attenue">Robustesse : {r.libelle} (6 caractères minimum)</p>
        </div>
      )}
      {erreur && (
        <p role="alert" className="mt-1.5 text-sm text-erreur">
          {erreur}
        </p>
      )}
    </div>
  )
}
