import type { ContenuPage } from '../types'
import { action, actionHero, ancre, ecrire, image, imageHero, menu, plage, plan, repeter, retirer, un } from './outils'

/** Template « Conference » : forum, conférence ou séminaire sobre en bleu et blanc. */
export function appliquerForum(doc: Document, c: ContenuPage) {
  /* En-tête */
  ecrire(doc, '.site-branding .logo span', c.nomSite)
  menu(un(doc, '#navbar-items > ul'), c.menu)

  /* Hero */
  const hero = un(doc, '#hero')
  ecrire(hero ?? doc, 'h2', [c.dateTexte, c.lieu].filter(Boolean).join(' / '))
  ecrire(hero ?? doc, 'h1', c.titre)
  if (c.accroche) ecrire(hero ?? doc, '.intro p', c.accroche)
  else retirer(hero ?? doc, '.intro p')
  if (c.imageHero) imageHero(hero, null, c.imageHero, c)
  const zoneAction = un(doc, '.hero-actions')
  if (zoneAction) actionHero(doc, zoneAction, c)

  /* À propos */
  const apropos = un(doc, '#about')
  if (apropos && (c.apropos || c.textes.length > 0)) {
    const principal = c.apropos
    if (principal) {
      ecrire(apropos, '.about-text .section-title', principal.titre)
      ecrire(apropos, '.about-text p', principal.texte)
      if (principal.image) image(un(apropos, '.about-image img'), principal.image, principal.titre)
      else {
        retirer(apropos, '.about-image')
        un(apropos, '.about-text')?.setAttribute('class', 'col-sm-12 about-text')
      }
    } else {
      retirer(apropos, '.about-text', '.about-image')
    }
    const zone = un(apropos, '.about-extra')
    for (const t of c.textes) {
      if (!zone) break
      const col = doc.createElement('div')
      col.className = 'col-sm-6'
      col.id = t.id
      const titre = doc.createElement('h3')
      titre.className = 'section-title multiple-title'
      titre.textContent = t.titre
      const p = doc.createElement('p')
      p.textContent = t.texte
      col.append(titre, p)
      if (t.image) {
        const img = doc.createElement('img')
        img.className = 'img-responsive'
        img.alt = t.titre
        img.src = t.image
        col.append(img)
      }
      zone.append(col)
    }
    if (!c.textes.length) retirer(apropos, '.about-extra')
  } else {
    retirer(doc, '#about')
  }

  /* Chiffres clés */
  const faits = un(doc, '#facts')
  if (faits) {
    ecrire(faits, '.fact-date h3', c.dateTexte)
    if (c.lieu) ecrire(faits, '.fact-lieu h3', c.lieu)
    else retirer(faits, '.fact-lieu')
    const nb = c.intervenants?.liste.length ?? 0
    const h3 = un(faits, '.fact-speakers h3')
    if (nb > 0 && h3) {
      h3.textContent = ''
      h3.append(String(nb), doc.createElement('br'), c.intervenants?.titre ?? '')
    } else retirer(faits, '.fact-speakers')
  }

  /* Intervenants */
  const sp = un(doc, '#speakers')
  if (sp && c.intervenants && c.intervenants.liste.length > 0) {
    ancre(sp, 'intervenants')
    ecrire(sp, '.section-title', c.intervenants.titre)
    if (c.intervenants.sousTitre) ecrire(sp, '.section-sub', c.intervenants.sousTitre)
    else retirer(sp, '.section-sub')
    repeter(un(sp, '.speaker-col'), c.intervenants.liste, (el, p) => {
      image(un(el, 'img'), p.photo, p.nom)
      ecrire(el, 'h4', p.nom)
      ecrire(el, 'p', p.role)
    })
  } else {
    retirer(doc, '#speakers')
  }

  /* Programme par jour */
  const sc = un(doc, '#schedule')
  const jours = c.programme?.jours.filter((j) => j.lignes.length > 0) ?? []
  const zoneJours = sc ? un(sc, '.schedule-days') : null
  if (sc && c.programme && jours.length > 0 && zoneJours) {
    ancre(sc, 'programme')
    ecrire(sc, '.section-title', c.programme.titre)
    if (c.programme.sousTitre) ecrire(sc, '.section-sub', c.programme.sousTitre)
    else retirer(sc, '.section-sub')
    zoneJours.textContent = ''
    jours.forEach((j, i) => {
      const jour = doc.createElement('div')
      jour.className = 'schedule-day'
      jour.id = `jour-${i + 1}`
      const titre = doc.createElement('h3')
      titre.textContent = j.dateLongue || j.etiquette
      const rangee = doc.createElement('div')
      rangee.className = 'row'
      for (const l of j.lignes) {
        const col = doc.createElement('div')
        col.className = 'col-md-4 col-sm-6'
        const boite = doc.createElement('div')
        boite.className = 'schedule-box'
        const temps = doc.createElement('div')
        temps.className = 'time'
        temps.textContent = plage(l.debut, l.fin)
        const h = doc.createElement('h3')
        h.textContent = l.titre
        boite.append(temps, h)
        const detail = [l.intervenant, l.description, l.lieu].filter(Boolean).join(' · ')
        if (detail) {
          const p = doc.createElement('p')
          p.textContent = detail
          boite.append(p)
        }
        if (l.lienId) action(boite, 'ouvrir', l.lienId)
        col.append(boite)
        rangee.append(col)
      }
      jour.append(titre, rangee)
      zoneJours.append(jour)
    })
  } else {
    retirer(doc, '#schedule')
  }

  /* Billets */
  const billets = un(doc, '#billets')
  if (billets && c.offres.length > 0) {
    ecrire(billets, '.section-title', c.offres.some((o) => o.lienId) ? 'Pass' : 'Billets')
    repeter(un(billets, '.offer-col'), c.offres, (col, o) => {
      ecrire(col, 'h3', o.nom)
      ecrire(col, '.prix', o.prix)
      repeter(un(col, 'ul li'), o.points, (li, p) => { li.textContent = p })
      action(un(col, '.btn'), o.lienId ? 'ouvrir' : 'reserver', o.lienId, c.boutonReserver)
    })
  } else {
    retirer(doc, '#billets')
  }

  /* Lieu */
  const lieu = un(doc, '#location')
  if (lieu && c.lieuInfos) {
    ancre(lieu, 'lieu')
    ecrire(lieu, '.section-title', c.lieuInfos.titre)
    const adresse = un(lieu, 'address')
    if (adresse) {
      adresse.textContent = ''
      for (const t of [c.lieuInfos.adresse, c.lieuInfos.texte, c.lieuInfos.telephone, c.lieuInfos.email]) {
        if (!t) continue
        const p = doc.createElement('p')
        p.textContent = t
        adresse.append(p)
      }
    }
    un(lieu, '.map')?.append(plan(doc, c.lieuInfos.adresse || c.lieu || c.titre))
  } else {
    retirer(doc, '#location')
  }

  /* Pied de page */
  ecrire(doc, '.site-footer .site-info', `© ${new Date().getFullYear()} ${c.nomSite}`)
}
