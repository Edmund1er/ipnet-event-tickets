import { avatar } from '../contenu'
import type { ContenuPage } from '../types'
import { action, actionHero, ancre, ecrire, fond, image, logoTexte, menu, miniature, plage, plan, repeter, retirer, un } from './outils'

/** Template « Harbor Lights » habillé en « Lagon » : sortie à la plage, couleurs vives turquoise, corail et jaune soleil. */
export function appliquerLagon(doc: Document, c: ContenuPage) {
  const modeleTexte = un(doc, '#apropos')?.cloneNode(true) as HTMLElement | undefined

  /* En-tête */
  logoTexte(doc, un(doc, '.navbar-brand'), c.nomSite, 'color:#fff;font-size:26px')
  menu(un(doc, '#ftco-nav .navbar-nav'), c.menu)

  /* Hero */
  const hero = un(doc, '.home-slider .slider-item')
  if (c.imageHero) fond(hero, c.imageHero, c)
  if (c.accroche) ecrire(doc, '.lagon-accroche', c.accroche)
  else retirer(doc, '.lagon-accroche')
  ecrire(doc, '.lagon-titre', c.titre)
  ecrire(doc, '.lagon-date', c.dateTexte)
  if (c.lieu) ecrire(doc, '.lagon-lieu-hero', c.lieu)
  else retirer(doc, '.lagon-lieu-hero')
  actionHero(doc, un(doc, '.lagon-hero-action'), c)

  /* À propos + blocs de texte */
  const remplirTexte = (zone: HTMLElement, t: { titre: string; texte: string; image?: string; bouton?: string }, avecBouton: boolean) => {
    ecrire(zone, '.subheading', c.dateTexte)
    ecrire(zone, 'h2', t.titre)
    ecrire(zone, '.lagon-texte', t.texte)
    const bouton = un(zone, '.lagon-bouton')
    if (avecBouton) action(bouton, 'reserver', null, t.bouton)
    else bouton?.closest('p')?.remove()
    if (t.image) {
      const [a, b] = Array.from(zone.querySelectorAll<HTMLElement>('.img'))
      a?.style.setProperty('background-image', `url("${t.image.replace(/"/g, '%22')}")`)
      b?.remove()
    }
  }
  const apropos = un(doc, '#apropos')
  let dernier: HTMLElement | null = apropos
  if (apropos && c.apropos) remplirTexte(apropos, c.apropos, true)
  else {
    apropos?.remove()
    dernier = un(doc, '.hero')
  }
  for (const t of c.textes) {
    if (!modeleTexte || !dernier) break
    const bloc = modeleTexte.cloneNode(true) as HTMLElement
    ancre(bloc, t.id)
    remplirTexte(bloc, t, false)
    dernier.after(bloc)
    dernier = bloc
  }

  /* Intervenants */
  const sp = un(doc, '#intervenants')
  if (sp && c.intervenants && c.intervenants.liste.length) {
    ecrire(sp, '.lagon-titre-section', c.intervenants.titre)
    repeter(un(sp, '.lagon-speaker'), c.intervenants.liste, (el, p) => {
      image(un(el, 'img'), p.photo, p.nom)
      ecrire(el, 'h3', p.nom)
      if (p.role) ecrire(el, 'p', p.role)
      else retirer(el, 'p')
    })
  } else {
    sp?.remove()
  }

  /* Programme par jour */
  const prog = un(doc, '#programme')
  if (prog && c.programme && c.programme.jours.length) {
    ecrire(prog, '.lagon-titre-section', c.programme.titre)
    repeter(un(prog, '.lagon-jour'), c.programme.jours, (jour, j) => {
      ecrire(jour, 'h3', j.dateLongue)
      repeter(un(jour, '.lagon-ligne'), j.lignes, (row, l) => {
        const photo = un(row, 'img')
        if (l.intervenant) miniature(photo, avatar(l.intervenant), l.intervenant, 56)
        else photo?.remove()
        ecrire(row, '.heure', plage(l.debut, l.fin))
        ecrire(row, 'h4', l.titre)
        const detail = [l.intervenant, l.lieu, l.description].filter(Boolean).join(' — ')
        if (detail) ecrire(row, 'p', detail)
        else retirer(row, 'p')
        if (l.lienId) {
          action(row, 'ouvrir', l.lienId)
          row.style.cursor = 'pointer'
        }
      })
    })
  } else {
    prog?.remove()
  }

  /* Offres */
  const billets = un(doc, '#billets')
  if (billets && c.offres.length) {
    ecrire(billets, '.lagon-titre-offres', c.offres.some((o) => o.lienId) ? 'Choisissez votre pass' : 'Réservez votre place')
    repeter(un(billets, '.lagon-col'), c.offres, (col, o) => {
      ecrire(col, 'h3', o.nom)
      ecrire(col, '.prix', o.prix)
      repeter(un(col, 'li'), o.points.length ? o.points : [''], (li, p) => {
        li.textContent = p
      })
      if (!o.points.length) retirer(col, 'ul')
      const bouton = un(col, '.lagon-btn')
      if (o.lienId) action(bouton, 'ouvrir', o.lienId, 'Voir le pass')
      else action(bouton, 'reserver', null, c.boutonReserver)
    })
  } else {
    billets?.remove()
  }

  /* Lieu */
  const lieu = un(doc, '#lieu')
  if (lieu && c.lieuInfos) {
    ecrire(lieu, '.lagon-titre-lieu', c.lieuInfos.titre)
    const lignes = [c.lieuInfos.adresse, c.lieuInfos.telephone, c.lieuInfos.email].filter(Boolean) as string[]
    const adr = un(lieu, '.adresse')
    if (adr) {
      adr.textContent = ''
      lignes.forEach((t, i) => {
        if (i > 0) adr.append(doc.createElement('br'))
        adr.append(doc.createTextNode(t))
      })
    }
    if (c.lieuInfos.texte) ecrire(lieu, '.lagon-texte-lieu', c.lieuInfos.texte)
    else retirer(lieu, '.lagon-texte-lieu')
    const carte = un(lieu, '.carte')
    if (carte && c.lieuInfos.adresse) carte.append(plan(doc, c.lieuInfos.adresse))
    else carte?.closest('[class*="col-"]')?.remove()
  } else {
    lieu?.remove()
  }

  /* Pied de page */
  ecrire(doc, '.lagon-pied-nom', c.nomSite)
  ecrire(doc, '.lagon-pied-date', [c.dateTexte, c.lieu].filter(Boolean).join(' · '))
  const contact = un(doc, '.lagon-pied-contact')
  if (contact) {
    const lignes = [c.lieuInfos?.adresse, c.lieuInfos?.telephone, c.lieuInfos?.email].filter(Boolean) as string[]
    lignes.forEach((t, i) => {
      if (i > 0) contact.append(doc.createElement('br'))
      contact.append(doc.createTextNode(t))
    })
  }
}
