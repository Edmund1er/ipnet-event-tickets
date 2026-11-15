import { Link } from 'react-router-dom'
import { Icone } from '../../../core/components/ui/Icone'
import { useRequete } from '../../../core/hooks/useRequete'
import { dateLongue } from '../../../core/utils/format'
import { evenementService } from '../services/evenementService'

const ETAPES = [
  { icone: 'search', titre: '1. Trouve ta sortie', texte: 'Soirée, concert, plage, bal ou gospel : choisis le prochain moment à vivre avec ta team.' },
  { icone: 'payments', titre: '2. Réserve ta place', texte: 'Inscris-toi en quelques clics et règle par Mobile Money quand l’événement est payant.' },
  { icone: 'qr_code_scanner', titre: '3. Profite de la fête', texte: 'Présente ton billet QR à l’entrée et retrouve les infos pratiques avant de partir.' },
]

/** Accueil visiteur inspiré du HeroSection ScrewFast : deux colonnes, image IPNET, texte et CTA. */
export function VitrineHaut() {
  const { donnees: prochains } = useRequete(() => evenementService.lister({ page: 0 }), [])
  const prochain = prochains?.elements[0] ?? null
  const chiffres = [
    { icone: 'event', valeur: prochains ? String(prochains.totalElements) : '—', libelle: 'sorties à découvrir' },
    { icone: 'smartphone', valeur: 'Mobile Money', libelle: 'paiement simple' },
    { icone: 'qr_code_2', valeur: 'Billet QR', libelle: 'sur ton téléphone' },
    { icone: 'verified_user', valeur: 'En 2 min', libelle: 'réservation rapide' },
  ]

  return (
    <>
      <section id="hero" className="mx-auto grid max-w-[85rem] gap-4 px-4 py-14 sm:px-6 md:grid-cols-2 md:items-center md:gap-8 lg:px-8">
        <div>
          <h1 className="apparition block text-balance text-3xl font-bold tracking-tight text-neutral-800 sm:text-4xl lg:text-6xl lg:leading-tight dark:text-neutral-200">
            La fête commence <span className="text-yellow-500 dark:text-yellow-400">ici.</span>
          </h1>
          <p className="apparition apparition-2 mt-3 text-pretty text-lg leading-relaxed text-neutral-700 lg:w-4/5 dark:text-neutral-400">
            Soirées rap, concerts, journées plage, bal et gospel à Lomé. Trouve ta prochaine sortie, réserve ta place et retrouve ta team.
          </p>
          <div className="apparition apparition-3 mt-7 grid w-full gap-3 sm:inline-flex">
            <a href="#evenements" className="btn btn-sombre btn-grand">
              Explorer les sorties <Icone nom="arrow_forward" taille={18} />
            </a>
            {prochain && (
              <Link to={`/evenements/${prochain.id}`} className="btn btn-secondaire btn-grand max-w-full">
                <span className="truncate">À venir : {prochain.titre}</span>
              </Link>
            )}
          </div>
          {prochain && <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">Prochaine sortie · {dateLongue(prochain.dateDebut)}</p>}
        </div>
        <div className="flex w-full">
          <div className="w-full overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 dark:ring-white/10">
            <img src="/logo_ipnet.jpg" alt="IPNET Events" className="h-full min-h-[280px] w-full scale-105 object-cover object-center sm:min-h-[360px]" draggable={false} />
          </div>
        </div>
      </section>

      <section className="bg-fond-clair py-12 dark:bg-neutral-900/40" aria-label="La billetterie en un coup d’œil">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {chiffres.map((c) => (
            <div key={c.libelle} className="flex items-center gap-4 rounded-xl bg-neutral-100 p-6 shadow-xs ring-1 ring-neutral-300/60 dark:bg-neutral-800 dark:ring-neutral-700">
              <Icone nom={c.icone} taille={42} className="text-orange-400" />
              <div className="min-w-0">
                <p className="font-titre text-xl font-bold leading-tight text-encre dark:text-neutral-100">{c.valeur}</p>
                <p className="text-sm text-attenue">{c.libelle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[85rem] py-16">
        <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
          <div>
            <h2 className="text-balance text-2xl font-bold text-neutral-800 md:text-3xl dark:text-neutral-100">Moins d’attente, plus de souvenirs</h2>
            <p className="mt-3 text-pretty leading-relaxed text-neutral-600 dark:text-neutral-400">
              De la réservation à l’entrée, tout est au même endroit pour que tu profites pleinement de ta sortie.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-2">
            {[
              { i: 'bolt', t: 'Réservation rapide', d: 'Choisis ton événement et suis les places disponibles.' },
              { i: 'smartphone', t: 'Paiement Mobile Money', d: 'Règle simplement lorsque l’événement est payant.' },
              { i: 'qr_code_2', t: 'Billet sur ton téléphone', d: 'Retrouve ton QR dans ton espace quand l’organisateur en prévoit un.' },
              { i: 'music_note', t: 'Toutes les vibes', d: 'Soirées, live, plage, danse et fêtes de la jeunesse.' },
            ].map((f) => (
              <div key={f.t} className="flex gap-x-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-neutral-800">
                  <Icone nom={f.i} taille={24} />
                </span>
                <div>
                  <h3 className="font-bold text-neutral-800 dark:text-neutral-100">{f.t}</h3>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{f.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[85rem] py-16">
        <div className="titre-bloc">
          <span>Simple et rapide</span>
          <h2>Comment ça marche</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {ETAPES.map((e) => (
            <div key={e.titre} className="carte-service p-7">
              <div className="icone-carre mb-5"><Icone nom={e.icone} taille={28} /></div>
              <h3 className="text-lg font-bold text-encre">{e.titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-attenue">{e.texte}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

/** FAQ et appel final dans le même style clair que le template d'origine. */
export function VitrineBas() {
  return (
    <>
      <section className="mx-auto grid max-w-[85rem] gap-10 py-16 md:grid-cols-5">
        <div className="md:col-span-2">
          <h2 className="text-2xl font-bold text-neutral-800 md:text-4xl md:leading-tight dark:text-neutral-100">Questions<br />fréquentes</h2>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">Les réponses rapides avant de réserver ta sortie.</p>
        </div>
        <div className="flex flex-col gap-3 md:col-span-3">
          {[
            ['Comment recevoir mon billet ?', 'Si un QR est prévu pour l’événement, il apparaît dans « Mes billets » et peut être envoyé par e-mail.'],
            ['Quels moyens de paiement ?', 'Le paiement se fait par Mobile Money, directement depuis la page de réservation.'],
            ['Puis-je annuler ma réservation ?', 'Les conditions d’annulation sont indiquées sur la page de chaque événement.'],
            ['Je n’ai pas de billet QR, que faire ?', 'Vérifie les détails de ton inscription dans « Mes réservations » : certains événements gratuits se font sans QR.'],
          ].map(([q, r]) => (
            <details key={q} className="group rounded-xl bg-neutral-100 p-5 ring-1 ring-neutral-300/60 open:shadow-xs dark:bg-neutral-800 dark:ring-neutral-700">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-neutral-800 dark:text-neutral-100">
                {q}<Icone nom="expand_more" className="transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">{r}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[85rem] pb-16">
        <div className="rounded-xl bg-neutral-800 px-6 py-12 text-center sm:px-12 dark:bg-neutral-900">
          <h2 className="text-2xl font-bold text-neutral-50 sm:text-4xl">Prêt·e pour ta prochaine <span className="text-yellow-400">sortie</span> ?</h2>
          <p className="mx-auto mt-3 max-w-xl text-neutral-300">Crée ton compte, retrouve tes réservations et garde tes billets au même endroit.</p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/inscription" className="btn btn-sombre btn-grand">Créer un compte <Icone nom="arrow_forward" taille={18} /></Link>
            <Link to="/connexion" className="btn btn-secondaire btn-grand">Se connecter</Link>
          </div>
        </div>
      </section>
    </>
  )
}
