import type { Evenement } from '../../../core/api/types'
import { montant } from '../../../core/utils/format'
import { ambianceDe, ambiancePourModele, estHex } from '../theme/ambiances'
import type { ContenuPage, CreneauConfig, Jour, Ligne, Offre, PageConfig, SectionConfig } from './types'

const NOM_SITE = 'IPNET Events'

const cle = (iso: string) => iso.slice(0, 10)
const jourDe = (k: string) => new Date(`${k}T12:00:00`)
const hhmm = (iso: string) => iso.slice(11, 16)

const heureLisible = (hm: string) => hm.replace(':', 'h')
const datePass = (iso?: string | null) => iso
  ? new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  : 'la journée choisie'

function tarif(e: Evenement): string {
  if (e.accesLibre) return 'Accès libre'
  if (e.prix === 0) return 'Gratuit'
  return montant(e.prix, e.devise)
}

/** Photo de remplacement : initiales sur fond de couleur, générée en SVG (aucun fichier à stocker). */
export function avatar(nom: string): string {
  const mots = nom.trim().split(/\s+/)
  const initiales = ((mots[0]?.[0] ?? '?') + (mots.length > 1 ? (mots[mots.length - 1][0] ?? '') : '')).toUpperCase()
  let h = 0
  for (const c of nom) h = (h * 31 + c.charCodeAt(0)) % 360
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='400' height='400' fill='hsl(${h},45%,38%)'/><text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-family='Arial,sans-serif' font-size='150' font-weight='700' fill='white'>${initiales}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/** Affiche un visuel vectoriel premium selon l'ambiance si l'organisateur n'a pas fourni d'affiche. */
function afficheDeSecours(evt: Evenement): string {
  const cleAmbiance = evt.ambiance ?? ambiancePourModele(evt.modele)
  const ambiance = ambianceDe(cleAmbiance)
  const accent = estHex(evt.couleurPrincipale) ? evt.couleurPrincipale : ambiance.couleur
  const plage = cleAmbiance === 'PLAGE' || evt.modele === 'RENCONTRE'
  const nature = cleAmbiance === 'NATURE' || evt.modele === 'ATELIER'
  const couleurs = plage
    ? ['#f97316', '#06b6d4', '#075985']
    : nature
      ? ['#84cc16', '#166534', '#10251a']
      : ['#08090e', '#17111e', '#090a10']
  const decor = plage
    ? `<circle cx="1260" cy="220" r="122" fill="#fde68a" opacity=".9"/><path d="M0 555c180-54 300-54 480 0s300 54 480 0 300-54 640 0v345H0z" fill="#0891b2"/><path d="M0 650c180-48 300-48 480 0s300 48 480 0 300-48 640 0M0 740c180-42 300-42 480 0s300 42 480 0 300-42 640 0" fill="none" stroke="#a5f3fc" stroke-opacity=".72" stroke-width="8"/><path d="M1030 900l130-340 28 0 130 340" fill="#fb7185" opacity=".75"/>`
    : nature
      ? `<circle cx="1270" cy="200" r="105" fill="#facc15" opacity=".86"/><path d="M0 640 300 330l245 260 250-360 355 410 230-270 220 220v310H0z" fill="#166534"/><path d="M0 730 270 500l260 210 250-290 340 300 250-210 280 210v180H0z" fill="#10251a"/><g fill="#365314"><path d="M300 600l95-250 95 250zM340 670l55-190 55 190zM1120 650l80-225 80 225zM1160 700l40-140 40 140z"/></g>`
      : `<ellipse cx="1190" cy="280" rx="470" ry="390" fill="url(#lumiere)" opacity=".75"/><path d="M180 0h190l290 720H420zM990 0h130L950 760H820z" fill="url(#spot)" opacity=".5"/><circle cx="1190" cy="280" r="250" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="2"/><circle cx="1190" cy="280" r="340" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="2"/><g fill="none" stroke="#fff" stroke-opacity=".12"><path d="M0 760h1600M0 800h1600M0 840h1600"/><path d="M120 900l520-250M1480 900 960 650"/></g><g fill="${accent}" opacity=".72"><circle cx="300" cy="210" r="5"/><circle cx="440" cy="320" r="4"/><circle cx="1380" cy="500" r="6"/><circle cx="260" cy="570" r="3"/></g>`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><defs><linearGradient id="fond" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${couleurs[0]}"/><stop offset=".58" stop-color="${couleurs[1]}"/><stop offset="1" stop-color="${couleurs[2]}"/></linearGradient><radialGradient id="lumiere"><stop stop-color="${accent}" stop-opacity=".82"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient><linearGradient id="spot" x2="0" y2="1"><stop stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="1600" height="900" fill="url(#fond)"/>${decor}</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function dateTexte(e: Evenement): string {
  const d = new Date(e.dateDebut)
  if (e.type === 'CADRE' && e.dateFin) {
    const f = new Date(e.dateFin)
    const mois = (x: Date) => x.toLocaleDateString('fr-FR', { month: 'long' })
    if (d.getFullYear() !== f.getFullYear()) {
      return `${d.getDate()} ${mois(d)} ${d.getFullYear()} – ${f.getDate()} ${mois(f)} ${f.getFullYear()}`
    }
    return d.getMonth() === f.getMonth()
      ? `${d.getDate()} – ${f.getDate()} ${mois(f)} ${f.getFullYear()}`
      : `${d.getDate()} ${mois(d)} – ${f.getDate()} ${mois(f)} ${f.getFullYear()}`
  }
  const jour = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  return `${jour} · ${heureLisible(hhmm(e.dateDebut))}`
}

/** Regroupe des lignes par jour, triées par heure. */
function grouper(lignes: (Ligne & { jour: string })[]): Jour[] {
  const m = new Map<string, Ligne[]>()
  for (const { jour, ...l } of lignes) m.set(jour, [...(m.get(jour) ?? []), l])
  return [...m.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, ls]) => ({
      cle: k,
      etiquette: jourDe(k).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
      dateLongue: jourDe(k).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      lignes: ls.sort((x, y) => x.debut.localeCompare(y.debut)),
    }))
}

const creneauVersLigne = (c: CreneauConfig): Ligne & { jour: string } => ({
  jour: c.jour,
  debut: c.debut,
  fin: c.fin ?? undefined,
  titre: c.titre,
  description: c.description ?? undefined,
  intervenant: c.intervenant ?? undefined,
  lieu: c.lieu ?? undefined,
})

/**
 * Transforme (événement + activités + sections de l'admin) en contenu prêt pour un template.
 * Règle : sans section configurée, la page de base se construit seule à partir de l'événement ;
 * dès que l'admin ajoute des sections, seules les sections actives s'affichent (le titre, la date et la réservation restent toujours là).
 */
export function construireContenu(
  evt: Evenement,
  elements: Evenement[],
  config: PageConfig,
  urlImage: (nom: string) => string,
): ContenuPage {
  const sections = config.sections.filter((s) => s.actif)
  const configure = config.sections.length > 0
  const premiere = (type: SectionConfig['type']) => sections.find((s) => s.type === type)
  const estCadre = evt.type === 'CADRE'

  const hero = premiere('HERO')
  const apparence = config.apparence
  const apropos = premiere('A_PROPOS')
  const interv = premiere('INTERVENANTS')
  const prog = premiere('PROGRAMME')
  const lieuSec = premiere('LIEU')

  const imageHero = hero?.image ? urlImage(hero.image) : evt.aImage ? `/api/evenements/${evt.id}/image` : afficheDeSecours(evt)
  const couleur = (valeur?: string | null) => estHex(valeur) ? valeur : undefined
  const ancreType: Partial<Record<SectionConfig['type'], string>> = {
    HERO: 'hero', A_PROPOS: 'apropos', INTERVENANTS: 'intervenants', PROGRAMME: 'programme', LIEU: 'lieu',
  }
  const stylesSections = sections.map((s) => ({
    id: ancreType[s.type] ?? s.id,
    couleurFond: couleur(s.couleurFond),
    couleurTexte: couleur(s.couleurTexte),
    couleurAccent: couleur(s.couleurAccent),
    couleurCarte: couleur(s.couleurCarte),
    couleurBouton: couleur(s.couleurBouton),
  }))
  const blocs = sections
    .filter((s) => (s.type === 'CARTES' || s.type === 'COLONNES') && s.elements?.length)
    .map((s) => ({
      id: s.id,
      type: s.type as 'CARTES' | 'COLONNES',
      titre: s.titre?.trim() || (s.type === 'CARTES' ? 'À découvrir' : 'Informations'),
      sousTitre: s.sousTitre?.trim() || undefined,
      colonnes: Math.min(4, Math.max(2, s.colonnes ?? 3)),
      elements: (s.elements ?? []).filter((x) => x.titre.trim()).map((x) => ({
        id: x.id, titre: x.titre.trim(), texte: x.texte?.trim() || undefined, image: x.image ? urlImage(x.image) : undefined,
      })),
      style: stylesSections.find((style) => style.id === s.id)!,
    }))

  // Programme : activités du cadre + créneaux saisis à la main
  const lignes: (Ligne & { jour: string })[] = []
  if (estCadre && !(configure && config.sections.some((s) => s.type === 'PROGRAMME' && !s.actif))) {
    for (const a of elements.filter((x) => x.type === 'ACTIVITE' && x.statut !== 'ANNULE')) {
      lignes.push({
        jour: cle(a.dateDebut),
        debut: hhmm(a.dateDebut),
        fin: a.dateFin ? hhmm(a.dateFin) : undefined,
        titre: a.titre,
        description: a.description ?? undefined,
        lieu: a.lieu ?? undefined,
        lienId: a.id,
        tarif: tarif(a),
      })
    }
  }
  for (const c of prog?.creneaux ?? []) lignes.push(creneauVersLigne(c))
  const jours = grouper(lignes)

  const offres: Offre[] = estCadre
    ? elements
        .filter((x) => x.type === 'PASS' && x.statut === 'PUBLIE')
        .map((p) => ({
          nom: p.titre,
          prix: montant(p.prix, p.devise),
          points: [p.passPortee === 'JOURNEE' ? `Valable le ${datePass(p.passJour)}` : 'Valable pendant tout le programme', 'Accès aux activités incluses', 'Billet QR code'],
          lienId: p.id,
        }))
    : [
        {
          nom: evt.type === 'PASS' ? evt.titre : 'Billet',
          prix: tarif(evt),
          points: evt.accesLibre ? ['Accès libre', 'Aucun billet payant à réserver'] : ['Place nominative', 'Billet QR code par e-mail', 'Paiement Mobile Money'],
        },
      ]

  const intervenants = interv?.intervenants?.filter((i) => i.nom.trim())
  const contenu: ContenuPage = {
    titre: hero?.titre?.trim() || evt.titre,
    couleurPrincipale: estHex(apparence?.couleurPrincipale) ? apparence.couleurPrincipale : undefined,
    couleurSecondaire: estHex(apparence?.couleurSecondaire) ? apparence.couleurSecondaire : undefined,
    couleurBloc: estHex(apparence?.couleurBloc) ? apparence.couleurBloc : undefined,
    opaciteBloc: Math.min(90, Math.max(20, apparence?.opaciteBloc ?? 62)),
    apparencePage: {
      couleurEntete: couleur(apparence?.couleurEntete),
      couleurTexteEntete: couleur(apparence?.couleurTexteEntete),
      couleurFondPage: couleur(apparence?.couleurFondPage),
      couleurPied: couleur(apparence?.couleurPied),
      couleurTextePied: couleur(apparence?.couleurTextePied),
      couleurTexte: couleur(apparence?.couleurTexte),
      couleurCarte: couleur(apparence?.couleurCarte),
      couleurBouton: couleur(apparence?.couleurBouton),
    },
    stylesSections,
    blocs,
    accroche: hero?.sousTitre ?? undefined,
    dateTexte: dateTexte(evt),
    debutMs: new Date(evt.dateDebut).getTime(),
    lieu: evt.lieu ?? undefined,
    imageHero,
    boutonHero: hero?.bouton?.trim() || (evt.accesLibre ? 'Voir le programme' : evt.prix === 0 ? 'Je m’inscris' : 'Réserver ma place'),
    textes: sections
      .filter((s) => s.type === 'TEXTE' && (s.texte || s.titre))
      .map((s) => ({ id: s.id, titre: s.titre ?? '', texte: s.texte ?? '', image: s.image ? urlImage(s.image) : undefined })),
    offres,
    boutonReserver: evt.accesLibre ? 'Entrée libre' : evt.prix === 0 && !estCadre ? 'Je m’inscris' : 'Réserver',
    menu: [],
    nomSite: NOM_SITE,
  }

  // À propos : la description de l'événement, ou la section de l'admin
  const texteApropos = apropos?.texte ?? (!configure ? evt.description : null)
  if (apropos || (!configure && evt.description?.trim())) {
    contenu.apropos = {
      titre: apropos?.titre?.trim() || 'À propos',
      texte: texteApropos ?? '',
      image: apropos?.image ? urlImage(apropos.image) : undefined,
      bouton: apropos?.bouton?.trim() || contenu.boutonReserver,
    }
  }
  if (intervenants && intervenants.length > 0) {
    contenu.intervenants = {
      titre: interv?.titre?.trim() || 'Intervenants',
      sousTitre: interv?.sousTitre ?? undefined,
      liste: intervenants.map((i) => ({ nom: i.nom, role: i.role ?? '', photo: i.photo ? urlImage(i.photo) : avatar(i.nom) })),
    }
  }
  if (jours.length > 0) {
    contenu.programme = { titre: prog?.titre?.trim() || 'Programme', sousTitre: prog?.sousTitre ?? undefined, jours }
  }
  const adresse = lieuSec?.adresse?.trim() || (!configure || lieuSec ? evt.lieu?.trim() : undefined)
  if (lieuSec || (!configure && evt.lieu?.trim())) {
    contenu.lieuInfos = {
      titre: lieuSec?.titre?.trim() || 'Lieu',
      adresse: adresse ?? '',
      texte: lieuSec?.texte ?? undefined,
      telephone: lieuSec?.telephone ?? undefined,
      email: lieuSec?.email ?? undefined,
      image: lieuSec?.image ? urlImage(lieuSec.image) : undefined,
    }
  }

  // Menu : uniquement ce qui existe
  if (contenu.apropos) contenu.menu.push({ libelle: 'À propos', ancre: 'apropos' })
  if (contenu.intervenants) contenu.menu.push({ libelle: 'Intervenants', ancre: 'intervenants' })
  if (contenu.programme) contenu.menu.push({ libelle: 'Programme', ancre: 'programme' })
  if (contenu.lieuInfos) contenu.menu.push({ libelle: 'Lieu', ancre: 'lieu' })
  if (contenu.offres.length > 0) contenu.menu.push({ libelle: estCadre ? 'Pass' : 'Billets', ancre: 'billets' })
  return contenu
}
