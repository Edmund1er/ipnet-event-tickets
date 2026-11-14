import type { Evenement } from '../../../core/api/types'
import { montant } from '../../../core/utils/format'
import type { ContenuPage, CreneauConfig, Jour, Ligne, Offre, PageConfig, SectionConfig } from './types'

const NOM_SITE = 'IPNET Events'

const cle = (iso: string) => iso.slice(0, 10)
const jourDe = (k: string) => new Date(`${k}T12:00:00`)
const hhmm = (iso: string) => iso.slice(11, 16)

const heureLisible = (hm: string) => hm.replace(':', 'h')

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

function dateTexte(e: Evenement): string {
  const d = new Date(e.dateDebut)
  if (e.type === 'CADRE' && e.dateFin) {
    const f = new Date(e.dateFin)
    const mois = (x: Date) => x.toLocaleDateString('fr-FR', { month: 'long' })
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
  const apropos = premiere('A_PROPOS')
  const interv = premiere('INTERVENANTS')
  const prog = premiere('PROGRAMME')
  const lieuSec = premiere('LIEU')

  const imageHero = hero?.image ? urlImage(hero.image) : evt.aImage ? `/api/evenements/${evt.id}/image` : undefined

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
          points: [p.passPortee === 'JOURNEE' ? 'Valable un jour' : 'Valable pendant tout le programme', 'Accès à toutes les activités incluses', 'Billet QR code'],
          lienId: p.id,
        }))
    : [
        {
          nom: evt.type === 'PASS' ? evt.titre : 'Billet',
          prix: tarif(evt),
          points: ['Place nominative', 'Billet QR code par e-mail', 'Paiement Mobile Money'],
        },
      ]

  const intervenants = interv?.intervenants?.filter((i) => i.nom.trim())
  const contenu: ContenuPage = {
    titre: hero?.titre?.trim() || evt.titre,
    accroche: hero?.sousTitre ?? undefined,
    dateTexte: dateTexte(evt),
    debutMs: new Date(evt.dateDebut).getTime(),
    lieu: evt.lieu ?? undefined,
    imageHero,
    boutonHero: hero?.bouton?.trim() || (evt.prix === 0 ? 'Je m’inscris' : 'Réserver ma place'),
    textes: sections
      .filter((s) => s.type === 'TEXTE' && (s.texte || s.titre))
      .map((s) => ({ id: s.id, titre: s.titre ?? '', texte: s.texte ?? '', image: s.image ? urlImage(s.image) : undefined })),
    offres,
    boutonReserver: evt.prix === 0 && !estCadre ? 'Je m’inscris' : 'Réserver',
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
