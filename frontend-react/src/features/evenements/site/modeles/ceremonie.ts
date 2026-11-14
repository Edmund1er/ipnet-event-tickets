import { avatar } from '../contenu'
import type { ContenuPage } from '../types'
import { action, ancre, ecrire, fond, image, logoTexte, menu, miniature, plan, repeter, retirer, tous, un } from './outils'

/** Écrit un titre « Début <mot en couleur> » comme dans le template. */
function titreDouble(doc: Document, el: HTMLElement | null, texte: string) {
  if (!el) return
  const mots = texte.trim().split(/\s+/)
  el.textContent = ''
  if (mots.length === 1) {
    const s = doc.createElement('span')
    s.className = 'alternate'
    s.textContent = mots[0]
    el.append(s)
    return
  }
  const dernier = mots.pop() as string
  el.append(doc.createTextNode(`${mots.join(' ')} `))
  const s = doc.createElement('span')
  s.className = 'alternate'
  s.textContent = dernier
  el.append(s)
}

/** Template « Eventre » : cérémonie, gala, séminaire. Clair et formel, onglets de jours, pass en colonnes. */
export function appliquerCeremonie(doc: Document, c: ContenuPage) {
  const modeleTexte = un(doc, 'section.about')?.cloneNode(true) as HTMLElement | undefined

  /* En-tête */
  logoTexte(doc, un(doc, '.navbar-brand'), c.nomSite, 'color:#222;font-size:24px;padding:0 24px')
  const nav = un(doc, 'ul.navbar-nav')
  menu(nav, c.menu)
  nav?.querySelectorAll('a[data-toggle]').forEach((a) => a.removeAttribute('data-toggle'))
  nav?.querySelectorAll('li').forEach((li) => li.classList.remove('dropdown-slide'))
  const ticket = un(doc, 'a.ticket')
  action(ticket, 'reserver')
  ecrire(ticket ?? doc, 'span', c.boutonReserver)

  /* Bannière */
  const banniere = un(doc, 'section.banner')
  if (c.imageHero) fond(banniere, c.imageHero)
  const mots = c.titre.trim().split(/\s+/)
  ecrire(doc, '.banner .block h1', mots[0])
  ecrire(doc, '.banner .block h2', mots.slice(1).join(' ') || c.accroche || '')
  ecrire(doc, '.banner .block h6', [c.dateTexte, c.lieu].filter(Boolean).join(' · '))
  action(un(doc, '.banner a.btn'), 'reserver', null, c.boutonHero)

  /* À propos + blocs de texte */
  const remplirTexte = (zone: HTMLElement, t: { titre: string; texte: string; image?: string; bouton?: string }, avecBouton: boolean) => {
    titreDouble(doc, un(zone, '.content-block h2'), t.titre || 'À propos')
    ecrire(zone, '.description-one p', t.texte)
    retirer(zone, '.description-two')
    const boutons = un(zone, 'ul.list-inline')
    if (avecBouton) {
      action(un(zone, '.btn-main-md'), 'reserver', null, t.bouton)
      retirer(zone, '.btn-transparent-md')
      un(zone, '.btn-transparent-md')?.closest('li')?.remove()
    } else boutons?.remove()
    if (t.image) image(un(zone, '.image-block img'), t.image)
    else {
      un(zone, '.image-block')?.closest('[class*="col-"]')?.remove()
      const col = un(zone, '.content-block')?.closest<HTMLElement>('[class*="col-"]')
      if (col) col.className = 'col-lg-10 col-md-12 mx-auto'
    }
  }
  const apropos = un(doc, 'section.about')
  let dernier: HTMLElement | null = apropos
  if (apropos && c.apropos) {
    ancre(apropos, 'apropos')
    remplirTexte(apropos, c.apropos, true)
    apropos.querySelectorAll('.list-inline-item').forEach((li) => {
      if (!li.querySelector('a')) li.remove()
    })
  } else {
    apropos?.remove()
    dernier = un(doc, 'section.banner')
  }
  for (const t of c.textes) {
    if (!modeleTexte || !dernier) break
    const bloc = modeleTexte.cloneNode(true) as HTMLElement
    remplirTexte(bloc, t, false)
    dernier.after(bloc)
    dernier = bloc
  }

  /* Intervenants */
  const sp = un(doc, 'section.speakers')
  if (sp && c.intervenants) {
    ancre(sp, 'intervenants')
    titreDouble(doc, un(sp, '.section-title h3'), c.intervenants.titre)
    if (c.intervenants.sousTitre) ecrire(sp, '.section-title p', c.intervenants.sousTitre)
    else retirer(sp, '.section-title p')
    const colonne = un(sp, '.speaker-item')?.closest<HTMLElement>('[class*="col-lg-3"]') ?? null
    repeter(colonne, c.intervenants.liste, (el, p) => {
      image(un(el, '.image img'), p.photo, p.nom)
      ecrire(el, '.content h5 a', p.nom)
      un(el, '.content h5 a')?.setAttribute('href', '#')
      ecrire(el, '.content p', p.role)
      retirer(el, '.socials')
    })
  } else {
    retirer(doc, 'section.speakers')
  }

  /* Programme : onglets de jours, tableau Heure / Intervenant / Sujet / Lieu */
  const sc = un(doc, 'section.schedule')
  if (sc && c.programme) {
    ancre(sc, 'programme')
    titreDouble(doc, un(sc, '.section-title h3'), c.programme.titre)
    if (c.programme.sousTitre) ecrire(sc, '.section-title p', c.programme.sousTitre)
    else retirer(sc, '.section-title p')
    const jours = c.programme.jours
    repeter(un(sc, '.nav-pills .nav-item'), jours, (li, j, i) => {
      const a = un(li, 'a')
      if (!a) return
      a.textContent = `Jour ${String(i + 1).padStart(2, '0')} `
      const s = doc.createElement('span')
      s.textContent = j.dateLongue
      a.append(s)
      a.setAttribute('href', `#jour-${i + 1}`)
      a.classList.toggle('active', i === 0)
    })
    repeter(un(sc, '.tab-pane'), jours, (pane, j, i) => {
      pane.id = `jour-${i + 1}`
      pane.classList.toggle('show', i === 0)
      pane.classList.toggle('active', i === 0)
      ecrire(pane, '.headings .time', 'Heure')
      ecrire(pane, '.headings .speaker', 'Intervenant')
      ecrire(pane, '.headings .subject', 'Sujet')
      ecrire(pane, '.headings .venue', 'Lieu')
      repeter(un(pane, 'li.schedule-details'), j.lignes, (li, l) => {
        ecrire(li, '.block .time span.time', l.debut.replace(':', 'h'))
        const speaker = un(li, '.speaker')
        if (l.intervenant && speaker) {
          miniature(un(speaker, 'img'), avatar(l.intervenant), l.intervenant, 36)
          ecrire(speaker, '.name', l.intervenant)
        } else if (speaker) {
          speaker.textContent = ''
        }
        ecrire(li, '.subject', l.titre)
        ecrire(li, '.venue', l.lieu ?? '')
        if (l.lienId) {
          action(li, 'ouvrir', l.lienId)
          li.style.cursor = 'pointer'
        }
      })
    })
  } else {
    retirer(doc, 'section.schedule')
  }

  retirer(doc, 'section.registration')

  /* Pass / billets */
  const prix = un(doc, 'section.pricing')
  if (prix && c.offres.length > 0) {
    ancre(prix, 'billets')
    titreDouble(doc, un(prix, '.section-title h3'), c.offres.some((o) => o.lienId) ? 'Choisir un pass' : 'Réserver un billet')
    retirer(prix, '.section-title p')
    const colonne = un(prix, '.pricing-item')?.closest<HTMLElement>('[class*="col-lg-4"]') ?? null
    const premiere = colonne
    // Les trois colonnes d'origine : on ne garde que la première comme modèle
    if (premiere) tous(prix, '.row > [class*="col-lg-4"]').forEach((col) => col !== premiere && col.remove())
    repeter(premiere, c.offres, (col, o, i) => {
      col.className = 'col-lg-4 col-md-6 mx-auto'
      const item = un(col, '.pricing-item')
      item?.classList.toggle('featured', c.offres.length > 1 ? i === 1 : true)
      ecrire(col, '.title h6', o.nom)
      ecrire(col, '.price h2', o.prix)
      ecrire(col, '.price p', 'par personne')
      repeter(un(col, '.feature-list li'), o.points, (li, p) => {
        li.textContent = ''
        const para = doc.createElement('p')
        const ico = doc.createElement('span')
        ico.className = 'fa fa-check-circle available'
        para.append(ico, doc.createTextNode(p))
        li.append(para)
      })
      const bouton = un(col, '.pricing-footer a')
      action(bouton, o.lienId ? 'ouvrir' : 'reserver', o.lienId, c.boutonReserver)
      bouton?.classList.replace('btn-transparent-md', 'btn-main-md')
    })
  } else {
    retirer(doc, 'section.pricing')
  }

  /* Appel final */
  const cta = un(doc, 'section.cta-ticket')
  if (cta) {
    titreDouble(doc, un(cta, '.content-block h2'), 'Réservez maintenant')
    ecrire(cta, '.content-block p', [c.dateTexte, c.lieu].filter(Boolean).join(' · '))
    action(un(cta, 'a.btn'), 'reserver', null, c.boutonReserver)
    retirer(cta, '.image-block')
  }
  retirer(doc, 'section.sponsors', 'section.news', 'section.cta-subscribe')

  /* Lieu */
  const carte = un(doc, 'section.map')
  if (carte && c.lieuInfos) {
    ancre(carte, 'lieu')
    const zone = un(carte, '#map')
    if (zone) {
      zone.textContent = ''
      zone.style.height = '420px'
      zone.append(plan(doc, c.lieuInfos.adresse || c.lieu || c.titre))
    }
    ecrire(carte, '.address-block h4', c.lieuInfos.titre)
    const lignes = tous(carte, '.address-list li')
    const valeurs = [c.lieuInfos.adresse, c.lieuInfos.telephone ?? c.lieuInfos.email]
    lignes.forEach((li, i) => {
      if (!valeurs[i]) return li.remove()
      ecrire(li, 'span', valeurs[i])
    })
    retirer(carte, 'a.btn')
  } else {
    retirer(doc, 'section.map')
  }

  /* Pied de page */
  const logoPied = un(doc, '.footer-logo')
  if (logoPied) {
    logoPied.textContent = ''
    const s = doc.createElement('span')
    s.textContent = c.nomSite
    s.style.cssText = 'color:#fff;font-weight:800;font-size:26px'
    logoPied.append(s)
  }
  retirer(doc, '.social-links-footer')
  ecrire(doc, '.copyright-text p', `© ${new Date().getFullYear()} ${c.nomSite} — Tous droits réservés`)
}
