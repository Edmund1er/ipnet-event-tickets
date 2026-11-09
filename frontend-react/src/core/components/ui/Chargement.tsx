export function Chargement({ taille = 24, clair = false }: { taille?: number; clair?: boolean }) {
  return (
    <span
      role="status"
      aria-label="Chargement"
      className={`inline-block animate-spin rounded-full border-2 ${clair ? 'border-white/40 border-t-white' : 'border-primaire/25 border-t-primaire'}`}
      style={{ width: taille, height: taille }}
    />
  )
}

export function ChargementPage({ texte = 'Chargement…' }: { texte?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-attenue">
      <Chargement taille={32} />
      <p className="text-sm">{texte}</p>
    </div>
  )
}
