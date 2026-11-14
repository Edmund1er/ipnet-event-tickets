import { createContext, useContext, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'

/**
 * Mode « immersion » : la page affichée prend toute la place et habille l'en-tête et le menu latéral
 * à ses couleurs (c'est le cas de la page d'un événement, qui est la page de son template).
 */
export interface Immersion {
  /** Valeur CSS de fond (couleur ou dégradé). */
  fond: string
  texte: string
  /** Couleur des éléments actifs (entrée de menu, bouton). */
  accent: string
  surAccent: string
  bordure: string
  /** Lien de retour affiché dans l'en-tête. */
  retour?: { libelle: string; vers: string }
  /** Mention courte (ex. « Brouillon »). */
  badge?: string
}

interface Contexte {
  immersion: Immersion | null
  definir: (i: Immersion | null) => void
}

const Ctx = createContext<Contexte>({ immersion: null, definir: () => undefined })

export function ImmersionProvider({ children }: { children: ReactNode }) {
  const [immersion, definir] = useState<Immersion | null>(null)
  const valeur = useMemo(() => ({ immersion, definir }), [immersion])
  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>
}

/** Immersion en cours (utilisée par les gabarits). */
export const useImmersionActive = () => useContext(Ctx).immersion

/** Active l'immersion tant que la page est affichée ; null : pas d'immersion. */
export function useImmersion(immersion: Immersion | null) {
  const { definir } = useContext(Ctx)
  const cle = JSON.stringify(immersion)
  useEffect(() => {
    definir(immersion)
    return () => definir(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle, definir])
}

/** Variables CSS appliquées à la racine du gabarit (voir index.css : [data-immersif]). */
export function variablesImmersion(i: Immersion): CSSProperties {
  return {
    '--lay-fond': i.fond,
    '--lay-texte': i.texte,
    '--lay-accent': i.accent,
    '--lay-sur-accent': i.surAccent,
    '--lay-bordure': i.bordure,
  } as CSSProperties
}
