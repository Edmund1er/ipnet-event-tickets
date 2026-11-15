interface Props {
  etape: 1 | 2 | 3 | 4
  programme?: boolean
}

/** Repère visuel du parcours de création; le programme est facultatif pour un événement simple. */
export function EtapesEvenement({ etape, programme = false }: Props) {
  const etapes = programme
    ? ['Infos & affiche', 'Jours & pass', 'Page & blocs', 'Aperçu & publication']
    : ['Infos & affiche', 'Page & blocs', 'Aperçu & publication']
  const indexActif = etape

  return (
    <nav aria-label="Étapes de création de l’événement" className="mb-5 rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:p-5">
      <ol className="grid grid-cols-3 gap-2 sm:gap-4" style={{ gridTemplateColumns: `repeat(${etapes.length}, minmax(0, 1fr))` }}>
        {etapes.map((libelle, index) => {
          const numero = index + 1
          const actif = numero === indexActif
          const termine = numero < indexActif
          return (
            <li key={libelle} aria-current={actif ? 'step' : undefined} className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${actif ? 'bg-[#17171d] text-lime-300' : termine ? 'bg-[#ff653d] text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                  {termine ? '✓' : `0${numero}`}
                </span>
                <span className={`hidden text-xs font-bold sm:block ${actif ? 'text-[#17171d]' : 'text-neutral-500'}`}>{libelle}</span>
              </div>
              <span className={`mt-2 block truncate text-[11px] font-bold sm:hidden ${actif ? 'text-[#17171d]' : 'text-neutral-500'}`}>{libelle}</span>
              {index < etapes.length - 1 && <span className={`ml-10 mt-2 hidden h-1 rounded-full sm:block ${termine ? 'bg-[#ff653d]' : 'bg-neutral-100'}`} />}
            </li>
          )
        })}
      </ol>
      {etape === 1 && <p className="mt-4 text-xs leading-relaxed text-neutral-500">Aucune compétence technique nécessaire : ajoute tes infos, choisis une ambiance, puis compose ta page avec aperçu en direct.</p>}
    </nav>
  )
}
