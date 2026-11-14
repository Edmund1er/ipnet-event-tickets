import { avatar } from '../contenu'
import type { ContenuPage } from '../types'
import { action, ancre, ecrire, image, logoTexte, menu, miniature, plan, repeter, retirer, tous, un } from './outils'

/** Template « TheEvent » : conférence, séminaire. Orateurs en grille, programme par onglets de jours, billets en lignes. */
export function appliquerConference(doc: Document, c: ContenuPage) {
  const modeleTexte = un(doc, '#hero .about-info .col-lg-6')?.cloneNode(true) as HTMLElement | undefined

  /* En-tête */
  logoTexte(doc, un(doc, '#header .logo'), c.nomSite, 'color:#fff')
  menu(un(doc, '#navmenu > ul'), c.menu)
  action(un(doc, '#header .cta-btn'), 'reserver', null, c.boutonReserver)

  /* Hero + bandeau « à propos » */
  const hero = un(doc, '#hero')
  ecrire(hero ?? doc, 'h2', c.titre)
  ecrire(hero ?? doc, '.container.text-center p', [c.dateTexte, c.lieu].filter(Boolean).join(' · '))
  if (c.imageHero) image(un(doc, '#hero > img'), c.imageHero)
  retirer(doc, '.pulsating-play-btn')
  const colonnes = tous(doc, '.about-info .row > [class*="col-"]')
  const [colApropos, colLieu, colDate] = colonnes
  if (colApropos) {
    const texte = c.apropos?.texte ?? c.accroche
    if (texte) {
      ecrire(colApropos, 'h2', c.apropos?.titre ?? 'À propos')
      ecrire(colApropos, 'p', texte)
      ancre(colApropos, 'apropos')
    } else {
      colApropos.remove()
    }
  }
  if (colLieu) {
    if (c.lieu) {
      ecrire(colLieu, 'h3', 'Lieu')
      ecrire(colLieu, 'p', c.lieu)
    } else colLieu.remove()
  }
  if (colDate) {
    ecrire(colDate, 'h3', 'Date')
    ecrire(colDate, 'p', c.dateTexte)
  }
  // Blocs de texte supplémentaires : sous le bandeau, avec le style du bloc « à propos »
  const zoneAbout = un(doc, '.about-info .row')
  for (const t of c.textes) {
    if (!modeleTexte || !zoneAbout) break
    const bloc = modeleTexte.cloneNode(true) as HTMLElement
    ecrire(bloc, 'h2', t.titre)
    ecrire(bloc, 'p', t.texte)
    zoneAbout.append(bloc)
  }

  /* Intervenants */
  const sp = un(doc, '#speakers')
  if (sp && c.intervenants) {
    ecrire(sp, '.section-title h2', c.intervenants.titre)
    repeter(un(sp, '.row.gy-4 > [class*="col-"]'), c.intervenants.liste, (el, p) => {
      image(un(el, 'img'), p.photo, p.nom)
      ecrire(el, 'h4 a', p.nom)
      un(el, 'h4 a')?.setAttribute('href', '#')
      ecrire(el, '.member-info-content span', p.role)
      retirer(el, '.social')
    })
  } else {
    retirer(doc, '#speakers')
  }

  /* Programme : onglets de jours */
  const sc = un(doc, '#schedule')
  if (sc && c.programme) {
    ecrire(sc, '.section-title h2', c.programme.titre)
    if (c.programme.sousTitre) ecrire(sc, '.section-title p', c.programme.sousTitre)
    else retirer(sc, '.section-title p')
    const jours = c.programme.jours
    repeter(un(sc, '.nav-tabs .nav-item'), jours, (li, j, i) => {
      const a = un(li, 'a')
      if (!a) return
      a.textContent = j.etiquette
      a.setAttribute('href', `#jour-${i + 1}`)
      a.classList.toggle('active', i === 0)
    })
    retirer(sc, '.sub-heading')
    repeter(un(sc, '[role="tabpanel"]'), jours, (pane, j, i) => {
      pane.id = `jour-${i + 1}`
      pane.classList.toggle('show', i === 0)
      pane.classList.toggle('active', i === 0)
      repeter(un(pane, '.schedule-item'), j.lignes, (row, l) => {
        ecrire(row, 'time', l.debut)
        const h4 = un(row, 'h4')
        if (h4) {
          h4.textContent = l.titre
          if (l.intervenant) {
            const s = doc.createElement('span')
            s.textContent = l.intervenant
            h4.append(s)
          }
        }
        if (l.description || l.lieu) ecrire(row, 'p', [l.description, l.lieu].filter(Boolean).join(' — '))
        else retirer(row, 'p')
        const photo = un(row, '.speaker img')
        if (l.intervenant && photo) miniature(photo, avatar(l.intervenant), l.intervenant, 64)
        else retirer(row, '.speaker')
        if (l.lienId) {
          action(row, 'ouvrir', l.lienId)
          row.style.cursor = 'pointer'
        }
      })
    })
  } else {
    retirer(doc, '#schedule')
  }

  /* Lieu */
  const lieu = un(doc, '#venue')
  if (lieu && c.lieuInfos) {
    ancre(lieu, 'lieu')
    ecrire(lieu, '.section-title h2', c.lieuInfos.titre)
    retirer(lieu, '.section-title p', '.venue-gallery-container')
    const carte = un(lieu, '.venue-map')
    if (carte) {
      carte.textContent = ''
      carte.append(plan(doc, c.lieuInfos.adresse || c.lieu || c.titre))
    }
    ecrire(lieu, '.venue-info h3', c.lieuInfos.adresse)
    const details = [c.lieuInfos.texte, c.lieuInfos.telephone, c.lieuInfos.email].filter(Boolean).join(' · ')
    if (details) ecrire(lieu, '.venue-info p', details)
    else retirer(lieu, '.venue-info p')
  } else {
    retirer(doc, '#venue')
  }

  /* Billets / pass */
  const billets = un(doc, '#buy-tickets')
  if (billets && c.offres.length > 0) {
    ecrire(billets, '.section-title h2', c.offres.some((o) => o.lienId) ? 'Pass' : 'Billets')
    retirer(billets, '.section-title p')
    repeter(un(billets, '.pricing-item'), c.offres, (row, o, i) => {
      row.classList.toggle('featured', i === 1)
      ecrire(row, 'h3', o.nom)
      ecrire(row, 'h4', o.prix)
      retirer(row, 'ul li.na')
      repeter(un(row, 'ul li'), o.points, (li, p) => {
        li.classList.remove('na')
        const s = un(li, 'span, strong')
        if (s) s.textContent = p
      })
      action(un(row, '.buy-btn'), o.lienId ? 'ouvrir' : 'reserver', o.lienId, c.boutonReserver)
    })
  } else {
    retirer(doc, '#buy-tickets')
  }
  ancre(billets, 'billets')

  retirer(doc, '#hotels', '#gallery', '#sponsors', '#faq', '#contact')

  /* Pied de page */
  ecrire(doc, '#footer .sitename', c.nomSite)
  const contact = un(doc, '#footer .footer-contact')
  if (contact) {
    contact.textContent = ''
    for (const t of [c.lieu, c.lieuInfos?.telephone, c.lieuInfos?.email].filter(Boolean) as string[]) {
      const p = doc.createElement('p')
      p.textContent = t
      contact.append(p)
    }
  }
  retirer(doc, '#footer .footer-links')
  ecrire(doc, '#footer .copyright .d-flex > div:first-child', `© ${new Date().getFullYear()} ${c.nomSite}`)
}
