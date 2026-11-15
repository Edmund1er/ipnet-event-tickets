import type { ContenuPage } from '../types'

/** Petites fonctions de manipulation du DOM partagées par les adaptateurs de templates. */

export const un = (racine: ParentNode, sel: string): HTMLElement | null => racine.querySelector<HTMLElement>(sel)
export const tous = (racine: ParentNode, sel: string): HTMLElement[] => Array.from(racine.querySelectorAll<HTMLElement>(sel))

/** Remplace le texte d'un élément (jamais de HTML : le texte est inséré tel quel). */
export function ecrire(racine: ParentNode, sel: string, valeur: string | undefined | null) {
  const el = un(racine, sel)
  if (el) el.textContent = valeur ?? ''
}

export function retirer(racine: ParentNode, ...sels: string[]) {
  for (const s of sels) tous(racine, s).forEach((e) => e.remove())
}

export function image(el: Element | null, url: string, alt = '') {
  if (!(el instanceof HTMLImageElement)) return
  el.setAttribute('src', url)
  el.removeAttribute('srcset')
  el.setAttribute('alt', alt)
}

/** Petite photo ronde (intervenant dans le programme) : taille imposée, la photo de remplacement n'a pas de taille propre. */
export function miniature(el: Element | null, url: string, alt: string, px: number) {
  if (!(el instanceof HTMLImageElement)) return
  image(el, url, alt)
  el.style.cssText = `width:${px}px;height:${px}px;max-width:${px}px;object-fit:cover;border-radius:50%`
}

function rgba(hex: string, opacite: number): string {
  const valeurs = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16))
  return `rgba(${valeurs[0]},${valeurs[1]},${valeurs[2]},${opacite})`
}

/** Image de fond du bandeau, avec le voile de couleur choisi par l'administrateur. */
export function fond(el: HTMLElement | null, url: string, c: ContenuPage) {
  if (!el) return
  const couleur = c.couleurBloc ?? '#21133b'
  const opacite = c.opaciteBloc / 100
  const image = `url("${url.replace(/"/g, '%22')}")`
  el.style.setProperty('background-image', `linear-gradient(135deg, ${rgba(couleur, opacite)}, ${rgba(couleur, opacite * 0.72)}), ${image}`, 'important')
  el.style.setProperty('background-size', 'cover', 'important')
  el.style.setProperty('background-position', 'center', 'important')
  el.style.setProperty('background-repeat', 'no-repeat', 'important')
}

/** Certains modèles utilisent une balise img plein écran au lieu d'un background CSS. */
export function imageHero(hero: HTMLElement | null, cible: HTMLImageElement | null, url: string, c: ContenuPage) {
  if (!hero) return
  cible?.remove()
  fond(hero, url, c)
}


/**
 * Duplique un élément « modèle » une fois par donnée, puis retire le modèle.
 * Les clones héritent de toutes les classes du template (animations, mise en page).
 */
export function repeter<T>(modele: HTMLElement | null, donnees: T[], remplir: (clone: HTMLElement, donnee: T, i: number) => void): HTMLElement[] {
  if (!modele || !modele.parentElement) return []
  const parent = modele.parentElement
  // Les autres éléments de démonstration du template (même balise, même classe) disparaissent : seules nos données restent
  const signature = (e: Element) => `${e.tagName}.${e.classList[0] ?? ''}`
  const sig = signature(modele)
  Array.from(parent.children).forEach((e) => {
    if (e !== modele && signature(e) === sig) e.remove()
  })
  const clones = donnees.map((d, i) => {
    const c = modele.cloneNode(true) as HTMLElement
    remplir(c, d, i)
    parent.insertBefore(c, modele)
    return c
  })
  modele.remove()
  return clones
}

/** Transforme un bouton ou un lien en action de l'application (réserver, ouvrir une activité). */
export function action(el: Element | null, type: 'reserver' | 'ouvrir' = 'reserver', id?: number | null, libelle?: string) {
  if (!el) return
  if (el.tagName === 'A') el.setAttribute('href', '#')
  if (el.tagName !== 'A' && el.tagName !== 'BUTTON') {
    el.setAttribute('role', 'link')
    el.setAttribute('tabindex', '0')
  }
  el.setAttribute('data-ipnet', type)
  if (id != null) el.setAttribute('data-id', String(id))
  if (libelle !== undefined) el.textContent = libelle
}

/** Plan intégré sans clé d'API : recherche de l'adresse. */
export function plan(doc: Document, adresse: string): HTMLIFrameElement {
  const f = doc.createElement('iframe')
  f.setAttribute('src', `https://www.google.com/maps?q=${encodeURIComponent(adresse)}&output=embed`)
  f.setAttribute('loading', 'lazy')
  f.setAttribute('referrerpolicy', 'no-referrer-when-downgrade')
  f.setAttribute('title', adresse)
  f.style.cssText = 'border:0;width:100%;height:100%;min-height:360px'
  return f
}

/** Reconstruit un menu <ul> à partir d'un modèle d'élément (<li><a>). */
export function menu(ul: HTMLElement | null, items: { libelle: string; ancre: string }[]) {
  if (!ul) return
  const li = ul.querySelector('li')
  if (!li) return
  const proto = li.cloneNode(true) as HTMLElement
  ul.textContent = ''
  items.forEach((it, i) => {
    const n = proto.cloneNode(true) as HTMLElement
    n.querySelectorAll('ul, .submenu, .dropdown-menu').forEach((x) => x.remove())
    const a = n.querySelector('a')
    if (a) {
      a.textContent = it.libelle
      a.setAttribute('href', `#${it.ancre}`)
      a.classList.toggle('active', i === 0)
    }
    n.classList.remove('dropdown')
    ul.append(n)
  })
}

/** Donne une ancre à une section pour le menu. */
export function ancre(el: Element | null, id: string) {
  el?.setAttribute('id', id)
}

/** Texte de logo : le nom du site, avec la police du template. */
export function logoTexte(doc: Document, lien: Element | null, nom: string, style = '') {
  if (!lien) return
  lien.textContent = ''
  const s = doc.createElement('span')
  s.textContent = nom
  s.style.cssText = `font-weight:800;font-size:24px;letter-spacing:.5px;line-height:1;${style}`
  lien.append(s)
}

/** « 9h00 – 10h30 » */
export function plage(debut: string, fin?: string): string {
  const h = (x: string) => x.replace(':', 'h')
  return fin ? `${h(debut)} – ${h(fin)}` : h(debut)
}
