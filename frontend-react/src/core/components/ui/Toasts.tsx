import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { Icone } from './Icone'

type Genre = 'succes' | 'erreur' | 'info'
interface Toast {
  id: number
  genre: Genre
  texte: string
}

const Ctx = createContext<(genre: Genre, texte: string) => void>(() => undefined)

export function ToastsProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const afficher = useCallback((genre: Genre, texte: string) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, genre, texte }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), genre === 'erreur' ? 7000 : 4500)
  }, [])

  return (
    <Ctx.Provider value={afficher}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex max-w-md items-start gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
              t.genre === 'succes' ? 'bg-succes' : t.genre === 'erreur' ? 'bg-rouge' : 'bg-primaire'
            }`}
          >
            <Icone nom={t.genre === 'succes' ? 'check_circle' : t.genre === 'erreur' ? 'error' : 'info'} pleine taille={20} />
            <span>{t.texte}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const afficher = useContext(Ctx)
  return {
    succes: (t: string) => afficher('succes', t),
    erreur: (t: string) => afficher('erreur', t),
    info: (t: string) => afficher('info', t),
  }
}
