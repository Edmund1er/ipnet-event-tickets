import { avatar } from '../contenu'
import type { ContenuPage } from '../types'
import { action, ancre, ecrire, fond, image, logoTexte, menu, miniature, plage, plan, repeter, retirer, tous, un } from './outils'

/** Template « Palatin » en habillage forêt : escapade nature, randonnée, verts profonds et tons de bois. */
export function appliquerForet(doc: Document, c: ContenuPage) {
  doc.querySelector('.preloader')?.remove()
  tous(doc, '.wow').forEach((e) => e.classList.remove('wow'))

  /* En-tête */
  logoTexte(doc, un(doc, '.nav-brand'), c.nomSite, 'color:#f4efe3;font-style:italic;font-size:24px')
  menu(un(doc, '.classynav > ul'), c.menu)
  action(un(doc, '.menu-btn a'), 'reserver', null, c.boutonReserver)

  /* Hero */
  const hero = un(doc, '.hero-area')
  ancre(hero, 'hero')
  if (c.imageHero) fond(un(doc, '.single-hero-slide .slide-img'), c.imageHero, c)
  ecrire(doc, '.hero-slides-content h2', c.titre)
  const accroche = c.accroche ?? [c.dateTexte, c.lieu].filter(Boolean).join(' · ')
  if (accroche) ecrire(doc, '.foret-accroche', accroche)
  else retirer(doc, '.foret-accroche')
  action(un(doc, '.foret-hero-btn'), 'reserver', null, c.boutonHero)

  /* À propos + blocs de texte */
  const modeleTexte = un(doc, '#apropos')?.cloneNode(true) as HTMLElement | undefined
  const remplir = (zone: HTMLElement, t: { titre: string; texte: string; image?: string; bouton?: string }, avecBouton: boolean) => {
    ecrire(zone, '.section-heading h2', t.titre)
    ecrire(zone, '.foret-texte', t.texte)
    const bouton = un(zone, '.foret-btn')
    if (avecBouton) action(bouton, 'reserver', null, t.bouton)
    else bouton?.remove()
    if (t.image) image(un(zone, '.foret-image'), t.image, t.titre)
    else {
      un(zone, '.foret-col-image')?.remove()
      const col = un(zone, '.foret-col-texte')
      if (col) col.className = 'col-12 col-lg-8 mx-auto foret-col-texte'
    }
  }
  const apropos = un(doc, '#apropos')
  let dernier: HTMLElement | null = apropos
  if (apropos && c.apropos) remplir(apropos, c.apropos, true)
  else {
    apropos?.remove()
    dernier = hero
  }
  for (const t of c.textes) {
    if (!modeleTexte || !dernier) break
    const bloc = modeleTexte.cloneNode(true) as HTMLElement
    ancre(bloc, t.id)
    remplir(bloc, t, false)
    dernier.after(bloc)
    dernier = bloc
  }

  /* Intervenants */
  const sp = un(doc, '#intervenants')
  if (sp && c.intervenants && c.intervenants.liste.length) {
    ecrire(sp, '.section-heading h2', c.intervenants.titre)
    if (c.intervenants.sousTitre) ecrire(sp, '.section-heading p', c.intervenants.sousTitre)
    else retirer(sp, '.section-heading p')
    repeter(un(sp, '.foret-carte'), c.intervenants.liste, (el, p) => {
      un(el, '.bg-thumbnail')?.style.setProperty('background-image', `url("${p.photo.replace(/"/g, '%22')}")`)
      ecrire(el, 'h4', p.nom)
      ecrire(el, '.rooms-text p', p.role)
    })
  } else {
    sp?.remove()
  }

  /* Programme par jour */
  const pg = un(doc, '#programme')
  if (pg && c.programme && c.programme.jours.length) {
    ecrire(pg, '.section-heading h2', c.programme.titre)
    if (c.programme.sousTitre) ecrire(pg, '.section-heading p', c.programme.sousTitre)
    else retirer(pg, '.section-heading p')
    repeter(un(pg, '.foret-jour'), c.programme.jours, (jour, j) => {
      ecrire(jour, '.foret-jour-titre', j.dateLongue)
      repeter(un(jour, '.foret-ligne'), j.lignes, (row, l) => {
        ecrire(row, '.foret-heure', plage(l.debut, l.fin))
        ecrire(row, 'h4', l.titre)
        const detail = [l.intervenant, l.lieu, l.description].filter(Boolean).join(' — ')
        if (detail) ecrire(row, 'p', detail)
        else retirer(row, 'p')
        if (l.intervenant) {
          const img = doc.createElement('img')
          un(row, '.foret-corps')?.prepend(img)
          miniature(img, avatar(l.intervenant), l.intervenant, 44)
        }
        if (l.lienId) action(row, 'ouvrir', l.lienId)
      })
    })
  } else {
    pg?.remove()
  }

  /* Billets */
  const bi = un(doc, '#billets')
  if (bi && c.offres.length) {
    ecrire(bi, '.section-heading h2', c.offres.some((o) => o.lienId) ? 'Choisissez votre pass' : 'Réservez votre place')
    repeter(un(bi, '.foret-offre'), c.offres, (el, o) => {
      ecrire(el, '.price-from', o.prix)
      ecrire(el, 'h4', o.nom)
      const p = un(el, '.rooms-text p')
      if (p) {
        p.textContent = ''
        o.points.forEach((pt, i) => {
          if (i > 0) p.append(doc.createElement('br'))
          p.append(doc.createTextNode(pt))
        })
      }
      if (o.lienId) action(un(el, '.book-room-btn'), 'ouvrir', o.lienId, c.boutonReserver)
      else action(un(el, '.book-room-btn'), 'reserver', null, c.boutonReserver)
    })
  } else {
    bi?.remove()
  }

  /* Lieu */
  const lieu = un(doc, '#lieu')
  const adresse = c.lieuInfos?.adresse ?? c.lieu
  if (lieu && adresse) {
    ecrire(lieu, '.section-heading h2', c.lieuInfos?.titre ?? 'Lieu')
    if (c.lieuInfos?.texte) ecrire(lieu, '.section-heading p', c.lieuInfos.texte)
    else retirer(lieu, '.section-heading p')
    ecrire(lieu, '.foret-adresse', adresse)
    if (c.lieuInfos?.telephone) ecrire(lieu, '.foret-tel', c.lieuInfos.telephone)
    else retirer(lieu, '.foret-tel')
    if (c.lieuInfos?.email) ecrire(lieu, '.foret-email', c.lieuInfos.email)
    else retirer(lieu, '.foret-email')
    un(lieu, '.home-map-area')?.append(plan(doc, adresse))
  } else {
    lieu?.remove()
  }

  /* Pied de page */
  ecrire(doc, '.foret-logo', c.nomSite)
  ecrire(doc, '.foret-pied', c.accroche ?? '')
  ecrire(doc, '.foret-date', [c.dateTexte, c.lieu].filter(Boolean).join(' · '))
}
