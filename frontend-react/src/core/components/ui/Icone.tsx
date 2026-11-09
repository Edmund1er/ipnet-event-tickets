interface Props {
  nom: string
  pleine?: boolean
  className?: string
  taille?: number
}

/** Icône Material Symbols (même jeu que la maquette). Décorative : masquée aux lecteurs d'écran. */
export function Icone({ nom, pleine, className = '', taille }: Props) {
  return (
    <span
      aria-hidden="true"
      className={`icone ${pleine ? 'icone-pleine' : ''} ${className}`}
      style={taille ? { fontSize: taille } : undefined}
    >
      {nom}
    </span>
  )
}
