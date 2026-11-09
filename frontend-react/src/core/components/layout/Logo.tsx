import { Link } from 'react-router-dom'

/** Le logo unique de l'application (public/logo_ipnet.jpg). La bande noire du bas de l'image est rognée. */
export function LogoImage({ className = '', alt = 'iP Net Institute of Technology — IP Events' }: { className?: string; alt?: string }) {
  return (
    <span className={`block aspect-[1359/755] overflow-hidden ${className}`}>
      <img src="/logo_ipnet.jpg" alt={alt} className="h-full w-full object-cover object-top" />
    </span>
  )
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex min-w-0 shrink items-center rounded-lg focus-visible:outline-2" aria-label="IP Events — accueil">
      <span className={`block shrink-0 overflow-hidden rounded-full border-2 border-white shadow-md ring-1 ring-primaire/30 ${compact ? 'h-10 w-10' : 'h-11 w-11 sm:h-12 sm:w-12'}`}>
        <img src="/logo_ipnet.jpg" alt="IP Events" className="h-full w-full origin-[58%_42%] scale-[1.6] object-cover object-[58%_42%]" />
      </span>
    </Link>
  )
}
