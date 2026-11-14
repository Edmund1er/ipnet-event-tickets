import { appliquerCeremonie } from './modeles/ceremonie'
import { appliquerConference } from './modeles/conference'
import { appliquerRencontre } from './modeles/rencontre'
import { appliquerSoiree } from './modeles/soiree'
import { MODELES, type CleModele, type ContenuPage } from './types'

/**
 * Moteur de pages : charge le template d'origine (HTML, CSS et scripts intacts), le remplit avec le contenu
 * de l'événement en manipulant le DOM (jamais de concaténation de texte : aucun risque d'injection),
 * retire ce qui n'a pas de contenu, puis renvoie le document prêt à afficher dans un cadre.
 */

type Adaptateur = (doc: Document, contenu: ContenuPage) => void

const ADAPTATEURS: Record<CleModele, Adaptateur> = {
  SOIREE: appliquerSoiree,
  CONFERENCE: appliquerConference,
  RENCONTRE: appliquerRencontre,
  CEREMONIE: appliquerCeremonie,
}

const squelettes = new Map<string, Promise<string>>()

function chargerSquelette(dossier: string): Promise<string> {
  let p = squelettes.get(dossier)
  if (!p) {
    p = fetch(`/modeles/${dossier}/squelette.html`).then((r) => {
      if (!r.ok) throw new Error(`Modèle introuvable (${r.status})`)
      return r.text()
    })
    p.catch(() => squelettes.delete(dossier))
    squelettes.set(dossier, p)
  }
  return p
}

/** Script injecté dans la page : transmet les clics sur les boutons d'action à l'application. */
const SCRIPT_PONT = `
document.addEventListener('click', function (e) {
  var cible = e.target && e.target.closest ? e.target.closest('[data-ipnet]') : null;
  if (cible) {
    e.preventDefault();
    var id = cible.getAttribute('data-id');
    window.parent.postMessage({ source: 'ipnet', type: cible.getAttribute('data-ipnet'), id: id ? Number(id) : null }, '*');
    return;
  }
  var lien = e.target && e.target.closest ? e.target.closest('a') : null;
  if (!lien) return;
  var href = lien.getAttribute('href') || '';
  if (lien.hasAttribute('data-toggle') || lien.hasAttribute('data-bs-toggle') || lien.hasAttribute('data-slide')) return;
  if (href === '' || href === '#') { e.preventDefault(); return; }
  if (href.charAt(0) === '#') {
    e.preventDefault();
    var t = null; try { t = document.querySelector(href); } catch (x) {}
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}, true);
`;

function finaliser(doc: Document, dossier: string, contenu: ContenuPage, origine: string) {
  // Scripts de cartes et de suivi : retirés (la carte est remplacée par un plan intégré sans clé d'API)
  doc.querySelectorAll('script').forEach((s) => {
    const src = s.getAttribute('src') ?? '';
    if (/googleapis\.com\/maps|google-map|gmap\.js|analytics|googletagmanager/i.test(src) || /initMap|google\.maps/.test(s.textContent ?? '')) s.remove();
  });
  // Formulaires de démonstration : retirés
  doc.querySelectorAll('form').forEach((f) => f.remove());
  // Liens vers les autres pages de démonstration : neutralisés (les liens externes sont conservés)
  doc.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href') ?? '';
    if (a.hasAttribute('data-ipnet')) return;
    if (/^https?:\/\//i.test(href)) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    } else if (/\.html?($|#|\?)/i.test(href) || href === '') {
      a.setAttribute('href', '#');
    }
  });

  const head = doc.head;
  const base = doc.createElement('base');
  base.setAttribute('href', `${origine}/modeles/${dossier}/`);
  head.prepend(base);
  const dates = doc.createElement('script');
  dates.textContent = `window.DATE_EVENEMENT_MS = ${Number.isFinite(contenu.debutMs) ? contenu.debutMs : 'null'};`;
  head.insertBefore(dates, base.nextSibling);
  const meta = doc.createElement('meta');
  meta.setAttribute('name', 'viewport');
  meta.setAttribute('content', 'width=device-width, initial-scale=1');
  if (!doc.querySelector('meta[name="viewport"]')) head.append(meta);
  doc.title = contenu.titre;

  const pont = doc.createElement('script');
  pont.textContent = SCRIPT_PONT;
  doc.body.append(pont);
}

/** Génère le document HTML complet d'un événement pour le modèle choisi. */
export async function genererPage(cle: CleModele, contenu: ContenuPage, origine = window.location.origin): Promise<string> {
  const dossier = MODELES.find((m) => m.cle === cle)?.dossier
  if (!dossier) throw new Error('Modèle inconnu')
  const html = await chargerSquelette(dossier)
  const doc = new DOMParser().parseFromString(html, 'text/html')
  ADAPTATEURS[cle](doc, contenu)
  finaliser(doc, dossier, contenu, origine)
  return '<!doctype html>' + doc.documentElement.outerHTML
}
