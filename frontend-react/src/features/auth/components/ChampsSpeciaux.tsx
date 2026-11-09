import { useId, useState } from 'react'
import { Icone } from '../../../core/components/ui/Icone'
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
  const [visible, setVisible] = useState(false)
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
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          className={`champ pr-12 ${erreur ? '!border-erreur' : ''}`}
          value={valeur}
          aria-invalid={!!erreur || undefined}
          onChange={(e) => surChangement(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded text-attenue hover:text-primaire"
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          <Icone nom={visible ? 'visibility_off' : 'visibility'} taille={20} />
        </button>
      </div>
      {avecJauge && valeur.length > 0 && (
        <div className="mt-2">
          <div className="flex gap-1" aria-hidden>
            {[1, 2, 3, 4].map((n) => (
              <span key={n} className={`h-1.5 flex-1 rounded ${r.score >= n ? couleurs[r.score] : 'bg-bordure'}`} />
            ))}
          </div>
          <p className="mt-1 text-xs text-attenue">Robustesse : {r.libelle} (12 caractères minimum)</p>
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
