import { ArrowRight, CalendarDays, CreditCard, Music2, QrCode, Sparkles, TicketCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useRequete } from '../../../core/hooks/useRequete'
import { dateLongue } from '../../../core/utils/format'
import { evenementService } from '../services/evenementService'
import { VisuelEvenement } from './CarteEvenement'

const ETAPES = [
  { icone: TicketCheck, titre: 'Choisis ta vibe', texte: 'Soirée, concert, beach day ou festival : trouve la sortie qui te ressemble.' },
  { icone: CreditCard, titre: 'Prends ton pass', texte: 'Réserve en quelques clics et règle facilement par Mobile Money.' },
  { icone: QrCode, titre: 'On se retrouve là-bas', texte: 'Ton billet QR arrive par e-mail. Présente-le à l’entrée et profite.' },
]

/** Vitrine visiteur : une porte d’entrée vers les fêtes, concerts et sorties de la jeunesse. */
export function VitrineHaut() {
  const { donnees: prochains } = useRequete(() => evenementService.lister({ page: 0 }), [])
  const prochain = prochains?.elements[0] ?? null
  const chiffres = [
    { icone: CalendarDays, valeur: prochains ? String(prochains.totalElements) : '—', libelle: 'sorties à découvrir' },
    { icone: CreditCard, valeur: 'Mobile Money', libelle: 'paiement simple' },
    { icone: QrCode, valeur: 'Billet QR', libelle: 'direct sur ton téléphone' },
    { icone: TicketCheck, valeur: 'En 2 min', libelle: 'réservation rapide' },
  ]

  return (
    <>
      <section id="hero" className="relative isolate mx-auto grid max-w-[85rem] gap-8 overflow-hidden rounded-[2rem] bg-[#0a0b10] px-5 py-8 text-white shadow-[0_32px_90px_-45px_rgba(6,8,15,.9)] sm:px-8 sm:py-10 md:grid-cols-[1.02fr_.98fr] md:items-center md:gap-10 md:px-12 md:py-14">
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-28 -z-10 h-80 w-80 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 left-1/3 -z-10 h-80 w-80 rounded-full bg-orange-500/15 blur-3xl" />
        <div>
          <span className="apparition inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold uppercase tracking-[.18em] text-lime-200">
            <Sparkles aria-hidden="true" className="h-4 w-4" /> La jeunesse sort, on s’occupe du billet
          </span>
          <h1 className="apparition mt-6 max-w-[12ch] text-balance font-titre text-4xl font-extrabold leading-[.98] tracking-[-.045em] sm:text-5xl lg:text-7xl">
            La prochaine <span className="text-[#ff653d]">vibe</span> commence ici.
          </h1>
          <p className="apparition apparition-2 mt-5 max-w-xl text-pretty text-base leading-relaxed text-white/70 sm:text-lg">
            Fêtes étudiantes, soirées rap, gospel, bal, journées plage et festivals de la jeunesse à Lomé. Choisis ta sortie, réserve ton pass et retrouve ta team.
          </p>
          <div className="apparition apparition-3 mt-7 flex flex-col gap-3 sm:flex-row">
            <a href="#evenements" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#ff653d] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#ff7956] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300">
              Explorer les sorties <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </a>
            {prochain && (
              <Link to={`/evenements/${prochain.id}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                <span className="truncate">À venir : {prochain.titre}</span>
              </Link>
            )}
          </div>
          <div className="mt-7 flex flex-wrap gap-2 text-xs font-semibold text-white/60" aria-label="Types de sorties">
            {['Soirées', 'Concerts', 'Plage & chill', 'Bal & gala', 'Gospel', 'Festival'].map((vibe) => (
              <a key={vibe} href="#evenements" className="rounded-full border border-white/10 px-3 py-1.5 transition hover:border-lime-300/40 hover:text-lime-200">{vibe}</a>
            ))}
          </div>
        </div>

        <div className="relative min-h-[330px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#15151f] sm:min-h-[410px]">
          {prochain ? (
            <VisuelEvenement evenement={prochain} />
          ) : (
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_25%,rgba(217,70,239,.58),transparent_34%),radial-gradient(ellipse_at_20%_85%,rgba(255,101,61,.42),transparent_45%),linear-gradient(135deg,#151421,#080a10)]">
              <div className="absolute -right-8 top-8 h-56 w-56 rounded-full border border-white/15" />
              <div className="absolute -right-1 top-16 h-40 w-40 rounded-full border border-white/10" />
              <Music2 className="absolute bottom-10 right-10 h-24 w-24 text-white/20" />
            </div>
          )}
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/5" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-xs font-bold text-lime-200 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_12px_#bef264]" /> À ne pas manquer
            </span>
            <h2 className="mt-4 max-w-[16ch] text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              {prochain?.titre ?? 'Ta prochaine sortie est tout près'}
            </h2>
            {prochain ? (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-white/75">
                <span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="h-4 w-4 text-lime-300" />{dateLongue(prochain.dateDebut)}</span>
                {prochain.lieu && <span>{prochain.lieu}</span>}
              </div>
            ) : <p className="mt-3 text-sm text-white/70">La scène se prépare. Les événements publiés apparaîtront ici.</p>}
            {prochain && <Link to={`/evenements/${prochain.id}`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white hover:text-lime-200">Voir le programme <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-10" aria-label="La billetterie en un coup d’œil">
        <div className="mx-auto grid max-w-[85rem] gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {chiffres.map((stat) => {
            const Ic = stat.icone
            return (
              <div key={stat.libelle} className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#15151f] text-lime-300"><Ic aria-hidden="true" className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <p className="truncate font-titre text-base font-extrabold leading-tight text-[#17171d]">{stat.valeur}</p>
                  <p className="text-xs text-neutral-500">{stat.libelle}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[85rem] py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:gap-12">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-[.18em] text-[#e44e2d]">Tout est prêt pour sortir</span>
            <h2 className="mt-3 max-w-[14ch] text-balance font-titre text-3xl font-extrabold leading-tight tracking-tight text-[#17171d] md:text-4xl">Moins de files. Plus de souvenirs.</h2>
            <p className="mt-4 max-w-md text-pretty leading-relaxed text-neutral-600">
              De la réservation au scan du billet, tout est simple pour que tu profites du moment avec ta bande.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              { i: TicketCheck, t: 'Ta place est réservée', d: 'Suis les disponibilités et retrouve tes billets au même endroit.' },
              { i: CreditCard, t: 'Paiement sans prise de tête', d: 'Règle avec les moyens Mobile Money disponibles au Togo.' },
              { i: QrCode, t: 'Ton QR, ton entrée', d: 'Le billet arrive par e-mail et se présente directement sur ton téléphone.' },
              { i: Music2, t: 'Un programme qui bouge', d: 'Retrouve les artistes, les horaires et les infos pratiques avant de partir.' },
            ].map((feature) => {
              const Ic = feature.i
              return (
                <div key={feature.t} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#17171d] text-lime-300"><Ic aria-hidden="true" className="h-5 w-5" /></span>
                  <div>
                    <h3 className="font-bold text-[#17171d]">{feature.t}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-600">{feature.d}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[85rem] py-12 sm:py-16">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-[.18em] text-[#e44e2d]">Simple du début à la fin</span>
            <h2 className="mt-2 font-titre text-3xl font-extrabold tracking-tight text-[#17171d]">Trois étapes et c’est parti.</h2>
          </div>
          <a href="#evenements" className="inline-flex items-center gap-2 text-sm font-bold text-[#17171d] hover:text-[#e44e2d]">Trouver une sortie <ArrowRight aria-hidden="true" className="h-4 w-4" /></a>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {ETAPES.map((step, index) => {
            const Ic = step.icone
            return (
              <div key={step.titre} className="relative overflow-hidden rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
                <span aria-hidden="true" className="absolute right-5 top-4 font-titre text-5xl font-black text-neutral-100">0{index + 1}</span>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ff653d] text-white"><Ic aria-hidden="true" className="h-6 w-6" /></span>
                <h3 className="mt-5 text-lg font-extrabold text-[#17171d]">{step.titre}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{step.texte}</p>
              </div>
            )
          })}
        </div>
      </section>
    </>
  )
}

/** FAQ et appel final. */
export function VitrineBas() {
  return (
    <>
      <section className="mx-auto grid max-w-[85rem] gap-8 py-12 sm:py-16 md:grid-cols-[.75fr_1.25fr]">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-[.18em] text-[#e44e2d]">Les infos utiles</span>
          <h2 className="mt-3 text-balance font-titre text-3xl font-extrabold text-[#17171d] md:text-4xl">Avant de faire la fête.</h2>
          <p className="mt-3 text-neutral-600">Les réponses rapides pour organiser ta sortie sereinement.</p>
        </div>
        <div className="flex flex-col gap-3">
          {[
            ['Comment recevoir mon billet ?', 'Après la réservation, ton billet avec QR code est envoyé par e-mail et reste disponible dans « Mes billets » .'],
            ['Quels moyens de paiement ?', 'Le paiement se fait par Mobile Money, directement depuis la page de réservation.'],
            ['Puis-je annuler ma réservation ?', 'Les conditions d’annulation sont indiquées sur la page de chaque événement.'],
            ['J’ai perdu mon billet, que faire ?', 'Reconnecte-toi : ton QR code reste accessible dans ton espace personnel.'],
          ].map(([question, reponse]) => (
            <details key={question} className="group rounded-2xl border border-black/5 bg-white p-5 shadow-sm open:border-[#ff653d]/30">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-[#17171d]">
                {question}<span aria-hidden="true" className="text-xl text-[#e44e2d] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">{reponse}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[85rem] pb-12 sm:pb-16">
        <div className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#11121a] px-6 py-10 text-white sm:px-12 sm:py-14">
          <div aria-hidden="true" className="absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-28 left-1/4 -z-10 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.18em] text-lime-200"><Sparkles aria-hidden="true" className="h-4 w-4" /> Ta prochaine sortie t’attend</span>
            <h2 className="mt-4 text-balance font-titre text-3xl font-extrabold sm:text-5xl">Rassemble ta team. <span className="text-[#ff7956]">On y va ?</span></h2>
            <p className="mx-auto mt-4 max-w-xl text-white/70">Crée ton compte pour réserver en quelques clics et garder tous tes billets au même endroit.</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/inscription" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#ff653d] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#ff7956]">Créer mon compte <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
              <Link to="/connexion" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">Me connecter</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
