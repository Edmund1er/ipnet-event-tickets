import { Link } from 'react-router-dom'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3 rounded focus-visible:outline-2" aria-label="IPNET Billetterie — accueil">
      <img
        src="/logo-ipnet.png"
        alt=""
        className={`${compact ? 'h-10 w-[52px]' : 'h-11 w-[58px]'} rounded-md border border-bordure object-cover`}
      />
      <span className="flex flex-col leading-tight">
        <span className="font-titre text-[17px] font-bold tracking-tight text-primaire">
          IPNET <span className="text-rouge">Billetterie</span>
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-attenue">Institute of Technology</span>
      </span>
    </Link>
  )
}
