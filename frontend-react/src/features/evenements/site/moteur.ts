import { appliquerForet } from './modeles/foret'
import { appliquerForum } from './modeles/forum'
import { appliquerLagon } from './modeles/lagon'
import { appliquerAtelier } from './modeles/atelier'
import { appliquerCeremonie } from './modeles/ceremonie'
import { appliquerConference } from './modeles/conference'
import { appliquerRencontre } from './modeles/rencontre'
import { appliquerReseautage } from './modeles/reseautage'
import { appliquerSalon } from './modeles/salon'
import { appliquerSoiree } from './modeles/soiree'
import { appliquerTournoi } from './modeles/tournoi'
import { estHex, texteSur } from '../theme/ambiances'
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
  ATELIER: appliquerAtelier,
  TOURNOI: appliquerTournoi,
  SALON: appliquerSalon,
  RESEAUTAGE: appliquerReseautage,
  LAGON: appliquerLagon,
  FORET: appliquerForet,
  FORUM: appliquerForum,
}

const squelettes = new Map<string, Promise<Document>>()

function chargerSquelette(dossier: string): Promise<Document> {
  let p = squelettes.get(dossier)
  if (!p) {
    p = fetch(`/modeles/${dossier}/squelette.html`).then((r) => {
      if (!r.ok) throw new Error(`Modèle introuvable (${r.status})`)
      return r.text()
    }).then((html) => new DOMParser().parseFromString(html, 'text/html'))
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
    var type = cible.getAttribute('data-ipnet');
    var id = Number(cible.getAttribute('data-id'));
    if (type !== 'reserver' && type !== 'ouvrir') return;
    if (type === 'ouvrir' && (!Number.isSafeInteger(id) || id < 1)) return;
    window.parent.postMessage({ source: 'ipnet', type: type, id: type === 'ouvrir' ? id : null }, '*');
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
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  var cible = e.target && e.target.closest ? e.target.closest('[data-ipnet]') : null;
  if (!cible) return;
  e.preventDefault();
  cible.click();
}, true);
`;

function appliquerPalette(doc: Document, contenu: ContenuPage) {
  const apparence = contenu.apparencePage
  const primaire = estHex(contenu.couleurPrincipale) ? contenu.couleurPrincipale : undefined
  const secondaire = estHex(contenu.couleurSecondaire) ? contenu.couleurSecondaire : undefined
  const bouton = estHex(apparence.couleurBouton) ? apparence.couleurBouton : primaire
  const declarations = [
    primaire && `--ipnet-primary:${primaire};--accent-color:${primaire};`,
    secondaire && `--ipnet-secondary:${secondaire};--heading-color:${secondaire};`,
    bouton && `--ipnet-button:${bouton};`,
    estHex(apparence.couleurCarte) && `--ipnet-card-bg:${apparence.couleurCarte};`,
  ].filter(Boolean).join('')
  const regles = [
    declarations && `:root{${declarations}}`,
    estHex(apparence.couleurFondPage) && `body{background-color:${apparence.couleurFondPage}!important;}`,
    estHex(apparence.couleurTexte) && `body{color:${apparence.couleurTexte}!important;}`,
    estHex(apparence.couleurEntete) && `body > header,#header,.header,.navbar,.navbar-area,.topbar,.rn-header,.atelier-header{background-color:${apparence.couleurEntete}!important;}`,
    estHex(apparence.couleurTexteEntete) && `body > header,#header,.header,.navbar,.navbar-area,.topbar,.rn-header,.atelier-header{color:${apparence.couleurTexteEntete}!important;}body > header :where(a,span,p,button),#header :where(a,span,p,button),.topbar :where(a,span,p,button),.rn-header :where(a,span,p,button),.atelier-header :where(a,span,p,button){color:inherit!important;}`,
    estHex(apparence.couleurPied) && `footer,#footer,.footer,.atelier-footer,.rn-footer{background-color:${apparence.couleurPied}!important;}`,
    estHex(apparence.couleurTextePied) && `footer,#footer,.footer,.atelier-footer,.rn-footer{color:${apparence.couleurTextePied}!important;}footer :where(a,span,p),#footer :where(a,span,p),.atelier-footer :where(a,span,p),.rn-footer :where(a,span,p){color:inherit!important;}`,
    bouton && `.cta-btn,.buy_ticket a,.buy_tkt a,.boxed-btn3,.boxed-btn-white,.ticket,.btn-main-md,.buy-btn,a[data-ipnet="reserver"]{background-color:${bouton}!important;border-color:${bouton}!important;color:${texteSur(bouton)}!important;}`,
    estHex(apparence.couleurCarte) && `.pricing-item,.single_propram,.single_performer,.single_speaker,.speaker-item,.member,.speaker-card,.rn-speaker,.rn-offer,.atelier-speaker,.atelier-day,.match-card,.expo-card,.ipnet-custom-card{background-color:${apparence.couleurCarte}!important;}`,
    secondaire && `.alternate,.section-title h2,.section-title h3,.section_title h3{color:${secondaire}!important;}`,
    primaire && `.nav-tabs .nav-link.active,.nav-pills .nav-link.active{background-color:${primaire}!important;}`,
    `img{max-width:100%}.ipnet-custom-block{padding:clamp(24px,4vw,64px) 20px;margin:0 auto;max-width:1200px}.ipnet-custom-block__head{margin:0 auto 24px;max-width:720px}.ipnet-custom-block__head h2{font-size:clamp(1.4rem,3vw,2.2rem);margin:0 0 8px}.ipnet-custom-grid{display:grid;grid-template-columns:repeat(var(--ipnet-columns,3),minmax(0,1fr));gap:18px}.ipnet-custom-card{min-width:0;overflow:hidden;border:1px solid rgba(15,23,42,.1);border-radius:16px;background:var(--ipnet-section-card,var(--ipnet-card-bg,#fff));box-shadow:0 8px 28px rgba(15,23,42,.08)}.ipnet-custom-card img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover}.ipnet-custom-card__body{padding:18px}.ipnet-custom-card h3{margin:0 0 8px;font-size:1.1rem}.ipnet-custom-card p{margin:0;line-height:1.6}@media(max-width:760px){.ipnet-custom-grid{grid-template-columns:1fr!important}}`,
    `[data-ipnet-section]{background-color:var(--ipnet-section-bg)!important;color:var(--ipnet-section-text)!important}[data-ipnet-section] h1,[data-ipnet-section] h2,[data-ipnet-section] h3,[data-ipnet-section] h4{color:var(--ipnet-section-accent)!important}[data-ipnet-section] .cta-btn,[data-ipnet-section] .buy_ticket a,[data-ipnet-section] .buy_tkt a,[data-ipnet-section] .boxed-btn3,[data-ipnet-section] .boxed-btn-white,[data-ipnet-section] .btn-main-md,[data-ipnet-section] .buy-btn,[data-ipnet-section] a[data-ipnet="reserver"]{background-color:var(--ipnet-section-button)!important;border-color:var(--ipnet-section-button)!important;color:var(--ipnet-section-button-text,#fff)!important}[data-ipnet-section] .ipnet-custom-card,[data-ipnet-section] .pricing-item,[data-ipnet-section] .single_propram,[data-ipnet-section] .single_speaker{background-color:var(--ipnet-section-card,var(--ipnet-card-bg,#fff))!important}`,
  ].filter(Boolean)
  if (regles.length) {
    const style = doc.createElement('style')
    style.textContent = regles.join('\n')
    doc.head.append(style)
  }
}

function appliquerStylesSections(doc: Document, contenu: ContenuPage) {
  for (const style of contenu.stylesSections) {
    const couleurs = [style.couleurFond, style.couleurTexte, style.couleurAccent, style.couleurCarte, style.couleurBouton]
    if (!couleurs.some(estHex)) continue
    const element = doc.getElementById(style.id)
    if (!element) continue
    element.setAttribute('data-ipnet-section', '')
    if (estHex(style.couleurFond)) element.style.setProperty('--ipnet-section-bg', style.couleurFond)
    if (estHex(style.couleurTexte)) element.style.setProperty('--ipnet-section-text', style.couleurTexte)
    if (estHex(style.couleurAccent)) element.style.setProperty('--ipnet-section-accent', style.couleurAccent)
    if (estHex(style.couleurCarte)) element.style.setProperty('--ipnet-section-card', style.couleurCarte)
    if (estHex(style.couleurBouton)) {
      element.style.setProperty('--ipnet-section-button', style.couleurBouton)
      element.style.setProperty('--ipnet-section-button-text', texteSur(style.couleurBouton))
    }
  }
}

function ajouterBlocs(doc: Document, contenu: ContenuPage) {
  let zone = doc.getElementById('ipnet-custom-blocks')
  const textesManquants = contenu.textes.filter((texte) => !doc.getElementById(texte.id))
  if (!contenu.blocs.length && !textesManquants.length) return
  if (!zone) {
    zone = doc.createElement('div')
    zone.id = 'ipnet-custom-blocks'
    const pied = doc.querySelector('footer,#footer,.footer')
    if (pied?.parentElement) pied.parentElement.insertBefore(zone, pied)
    else (doc.querySelector('main') ?? doc.body).append(zone)
  }
  for (const texte of textesManquants) {
    const section = doc.createElement('section')
    section.id = texte.id
    section.className = 'ipnet-custom-block ipnet-text-block'
    const titre = doc.createElement('h2')
    titre.textContent = texte.titre
    const description = doc.createElement('p')
    description.textContent = texte.texte
    section.append(titre, description)
    if (texte.image) {
      const photo = doc.createElement('img')
      photo.loading = 'lazy'
      photo.decoding = 'async'
      photo.alt = texte.titre
      photo.src = texte.image
      section.append(photo)
    }
    zone.append(section)
  }
  for (const bloc of contenu.blocs) {
    const section = doc.createElement('section')
    section.id = bloc.id
    section.className = `ipnet-custom-block ipnet-custom-block--${bloc.type.toLowerCase()}`
    section.style.setProperty('--ipnet-columns', String(bloc.colonnes))
    const head = doc.createElement('header')
    head.className = 'ipnet-custom-block__head'
    const titre = doc.createElement('h2')
    titre.textContent = bloc.titre
    head.append(titre)
    if (bloc.sousTitre) {
      const intro = doc.createElement('p')
      intro.textContent = bloc.sousTitre
      head.append(intro)
    }
    section.append(head)
    const grille = doc.createElement('div')
    grille.className = 'ipnet-custom-grid'
    for (const element of bloc.elements) {
      const carte = doc.createElement('article')
      carte.className = 'ipnet-custom-card'
      if (element.image) {
        const photo = doc.createElement('img')
        photo.loading = 'lazy'
        photo.decoding = 'async'
        photo.alt = element.titre
        photo.src = element.image
        carte.append(photo)
      }
      const corps = doc.createElement('div')
      corps.className = 'ipnet-custom-card__body'
      const titreCarte = doc.createElement('h3')
      titreCarte.textContent = element.titre
      corps.append(titreCarte)
      if (element.texte) {
        const description = doc.createElement('p')
        description.textContent = element.texte
        corps.append(description)
      }
      carte.append(corps)
      grille.append(carte)
    }
    section.append(grille)
    zone.append(section)
  }
}

function finaliser(doc: Document, dossier: string, contenu: ContenuPage, origine: string) {
  ajouterBlocs(doc, contenu)
  appliquerStylesSections(doc, contenu)
  appliquerPalette(doc, contenu)
  // Scripts de cartes et de suivi : retirés (la carte est remplacée par un plan intégré sans clé d'API)
  doc.querySelectorAll('script').forEach((s) => {
    const src = s.getAttribute('src') ?? '';
    if (/googleapis\.com\/maps|google-map|gmap\.js|analytics|googletagmanager|smoothscroll/i.test(src) || /initMap|google\.maps/.test(s.textContent ?? '')) s.remove();
  });
  // Les polices d'icônes locales seraient cross-origin dans l'iframe sandboxée ; le site utilise des fontes système en secours.
  doc.querySelectorAll('link[rel="stylesheet"][href]').forEach((l) => {
    if (/font.?awesome|bootstrap-icons|themify|flaticon/i.test(l.getAttribute('href') ?? '')) l.remove();
  })
  // Les scripts classiques sont différés, dans leur ordre initial, pour laisser le contenu se peindre avant leur exécution.
  doc.querySelectorAll<HTMLScriptElement>('script[src]:not([async]):not([defer])').forEach((script) => { script.defer = true })
  // Retire les animations et préchargeurs des sites démo : le contenu reste visible sans JS tiers.
  doc.querySelectorAll('[data-aos]').forEach((el) => {
    el.removeAttribute('data-aos')
    el.removeAttribute('data-aos-delay')
    el.removeAttribute('data-aos-duration')
    el.removeAttribute('data-aos-offset')
    el.classList.remove('aos-init', 'aos-animate')
  })
  doc.querySelector('#preloader')?.remove()

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
  doc.documentElement.lang = 'fr';

  const stylesActions = doc.createElement('style');
  stylesActions.textContent = `.ipnet-hero-cta{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:50px;margin-top:22px;padding:0 22px;border:1px solid rgba(255,255,255,.2);border-radius:14px;background:var(--ipnet-button,var(--accent-color,#ff653d));box-shadow:0 12px 30px rgba(0,0,0,.25);color:#fff!important;font-weight:800;text-decoration:none!important;transition:transform .2s ease,filter .2s ease}.ipnet-hero-cta:hover{transform:translateY(-2px);filter:brightness(1.08)}.ipnet-hero-cta:focus-visible,.ipnet-mobile-ticket-cta:focus-visible{outline:3px solid #bef264;outline-offset:3px}.ipnet-mobile-ticket-cta{display:none}@media(max-width:767px){body{padding-bottom:92px!important}.ipnet-mobile-ticket-cta{position:fixed;z-index:9999;right:14px;bottom:max(12px,env(safe-area-inset-bottom));left:14px;display:flex;min-height:54px;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.2);border-radius:15px;background:var(--ipnet-button,var(--accent-color,#ff653d));box-shadow:0 12px 32px rgba(0,0,0,.4);color:#fff!important;font-weight:800;text-decoration:none!important}}@media(prefers-reduced-motion:reduce){.ipnet-hero-cta{transition:none}.ipnet-hero-cta:hover{transform:none}}`;
  doc.head.append(stylesActions);

  const libre = contenu.offres.some((offre) => offre.points.includes('Accès libre'));
  const sticky = doc.createElement('a');
  sticky.className = 'ipnet-mobile-ticket-cta';
  sticky.textContent = libre ? 'Voir le programme' : contenu.boutonReserver;
  if (libre) sticky.href = doc.getElementById('programme') ? '#programme' : '#billets';
  else {
    sticky.href = '#';
    sticky.setAttribute('data-ipnet', 'reserver');
  }
  doc.body.append(sticky);

  const pont = doc.createElement('script');
  pont.textContent = SCRIPT_PONT;
  doc.body.append(pont);
}

/** Génère le document HTML complet d'un événement pour le modèle choisi. */
export async function genererPage(cle: CleModele, contenu: ContenuPage, origine = window.location.origin): Promise<string> {
  const dossier = MODELES.find((m) => m.cle === cle)?.dossier
  if (!dossier) throw new Error('Modèle inconnu')
  const prototype = await chargerSquelette(dossier)
  const doc = prototype.cloneNode(true) as Document
  ADAPTATEURS[cle](doc, contenu)
  finaliser(doc, dossier, contenu, origine)
  return '<!doctype html>' + doc.documentElement.outerHTML
}
