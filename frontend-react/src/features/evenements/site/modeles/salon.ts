import type { ContenuPage } from '../types'
import { action, ancre, ecrire, fond, image, logoTexte, menu, plage, repeter, retirer, un } from './outils'

/** Template « Salon » : exposition, portes ouvertes et découverte. */
export function appliquerSalon(doc: Document, c: ContenuPage) {
  /* Identité et navigation */
  logoTexte(doc, un(doc, '.brand'), c.nomSite, 'color:var(--ipnet-secondary, #183c3a);font-size:17px')
  const marque = un(doc, '.brand-mark')
  if (marque) marque.textContent = c.nomSite.trim().slice(0, 2).toUpperCase() || 'EX'
  const nav = un(doc, '.nav-list')
  menu(nav, c.menu)
  if (!c.menu.length) nav?.closest('nav')?.remove()
  action(un(doc, '[data-reserver]'), 'reserver', null, c.boutonReserver)
  ecrire(doc, '[data-footer-site]', c.nomSite)
  ecrire(doc, '[data-footer-copy]', `© ${new Date().getFullYear()} ${c.nomSite} — Tous droits réservés`)
  doc.title = c.titre

  /* Bandeau principal */
  const hero = un(doc, '.hero')
  ancre(hero, 'hero')
  ecrire(doc, '[data-event-title]', c.titre)
  ecrire(doc, '[data-event-intro]', c.accroche)
  if (!c.accroche) retirer(doc, '[data-event-intro]')
  ecrire(doc, '[data-event-date]', c.dateTexte)
  if (c.lieu) ecrire(doc, '[data-event-place]', c.lieu)
  else retirerLieu(doc)
  if (c.imageHero && hero) fond(hero, c.imageHero, c)
  action(un(doc, '[data-hero-action]'), 'reserver', null, c.boutonHero)
  ecrire(doc, '[data-closing-title]', c.offres.some((o) => o.lienId) ? 'Découvrez les pass disponibles' : 'Nous vous attendons')
  ecrire(doc, '[data-closing-meta]', [c.dateTexte, c.lieu].filter(Boolean).join(' · '))
  action(un(doc, '[data-closing-action]'), 'reserver', null, c.boutonReserver)

  /* À propos */
  const about = un(doc, '[data-about-section]')
  const texteApropos = c.apropos?.texte || c.accroche
  if (about && texteApropos) {
    ancre(about, 'apropos')
    ecrire(about, '[data-about-title]', c.apropos?.titre || 'À propos')
    ecrire(about, '[data-about-text]', texteApropos)
    if (c.apropos?.image) {
      const visuel = un(about, '[data-about-art]')
      if (visuel) {
        const photo = doc.createElement('img')
        image(photo, c.apropos.image, c.apropos.titre || 'Visuel de présentation')
        photo.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.86'
        visuel.prepend(photo)
      }
    }
    if (c.apropos?.bouton) action(un(about, '[data-about-action]'), 'reserver', null, c.apropos.bouton)
    else retirerElement(un(about, '[data-about-action]'))
  } else {
    about?.remove()
  }

  /* Blocs de contenu complémentaires */
  const zoneBlocs = un(doc, '#ipnet-custom-blocks')
  const modeleBloc = un(zoneBlocs ?? doc, '[data-custom-template]')
  if (zoneBlocs && modeleBloc) {
    for (const t of c.textes) {
      const bloc = modeleBloc.cloneNode(true) as HTMLElement
      bloc.id = t.id
      ecrire(bloc, '[data-custom-title]', t.titre)
      ecrire(bloc, '[data-custom-text]', t.texte)
      zoneBlocs.append(bloc)
    }
    modeleBloc.remove()
  }

  /* Exposants / intervenants */
  const exposants = un(doc, '[data-exhibitors-section]')
  if (exposants && c.intervenants?.liste.length) {
    ancre(exposants, 'intervenants')
    ecrire(exposants, '[data-exhibitors-title]', c.intervenants.titre)
    if (c.intervenants.sousTitre) ecrire(exposants, '[data-exhibitors-subtitle]', c.intervenants.sousTitre)
    else retirer(exposants, '[data-exhibitors-subtitle]')
    const modele = un(exposants, '[data-exhibitor-card]')
    repeter(modele, c.intervenants.liste, (carte, personne, index) => {
      const photo = un(carte, '[data-exhibitor-photo]')
      if (personne.photo) image(photo, personne.photo, personne.nom)
      else photo?.remove()
      ecrire(carte, '[data-exhibitor-number]', String(index + 1).padStart(2, '0'))
      ecrire(carte, '[data-exhibitor-name]', personne.nom)
      if (personne.role) ecrire(carte, '[data-exhibitor-role]', personne.role)
      else retirerElement(un(carte, '[data-exhibitor-role]'))
    })
  } else {
    exposants?.remove()
  }

  /* Programme par jour et créneaux */
  const programme = un(doc, '[data-programme-section]')
  if (programme && c.programme?.jours.length) {
    ancre(programme, 'programme')
    ecrire(programme, '[data-programme-title]', c.programme.titre)
    if (c.programme.sousTitre) ecrire(programme, '[data-programme-subtitle]', c.programme.sousTitre)
    else retirer(programme, '[data-programme-subtitle]')
    repeter(un(programme, '[data-programme-day]'), c.programme.jours, (jour, donnees, index) => {
      ecrire(jour, '[data-day-label]', donnees.etiquette || `Jour ${index + 1}`)
      ecrire(jour, '[data-day-date]', donnees.dateLongue)
      repeter(un(jour, '[data-programme-row]'), donnees.lignes, (ligne, creneau) => {
        ecrire(ligne, '[data-row-time]', plage(creneau.debut, creneau.fin))
        ecrire(ligne, '[data-row-title]', creneau.titre)
        const details = [creneau.description, creneau.intervenant, creneau.lieu].filter(Boolean).join(' · ')
        if (details) ecrire(ligne, '[data-row-detail]', details)
        else retirerElement(un(ligne, '[data-row-detail]'))
        if (creneau.lienId) {
          action(ligne, 'ouvrir', creneau.lienId)
          ligne.setAttribute('aria-label', `Ouvrir ${creneau.titre}`)
        } else {
          ligne.removeAttribute('tabindex')
        }
      })
    })
  } else {
    programme?.remove()
  }

  /* Informations pratiques du lieu */
  const lieu = un(doc, '[data-venue-section]')
  if (lieu && c.lieuInfos) {
    ancre(lieu, 'lieu')
    ecrire(lieu, '[data-venue-title]', c.lieuInfos.titre)
    ecrire(lieu, '[data-venue-description]', c.lieuInfos.texte)
    ecrire(lieu, '[data-venue-address]', c.lieuInfos.adresse || c.lieu)
    const contact = [c.lieuInfos.telephone, c.lieuInfos.email].filter(Boolean).join(' · ')
    if (contact) ecrire(lieu, '[data-venue-contact]', contact)
    else retirer(lieu, '[data-venue-contact]')
    if (c.lieuInfos.image) {
      const visuel = un(lieu, '[data-venue-art]')
      if (visuel) {
        const photo = doc.createElement('img')
        image(photo, c.lieuInfos.image, c.lieuInfos.titre)
        photo.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.82'
        visuel.append(photo)
      }
    }
  } else {
    lieu?.remove()
  }

  /* Billets et pass */
  const offres = un(doc, '[data-offers-section]')
  if (offres && c.offres.length) {
    ancre(offres, 'billets')
    ecrire(offres, '[data-offers-title]', c.offres.some((o) => o.lienId) ? 'Choisissez votre pass' : 'Choisissez votre accès')
    repeter(un(offres, '[data-offer-card]'), c.offres, (carte, offre) => {
      ecrire(carte, '[data-offer-name]', offre.nom)
      ecrire(carte, '[data-offer-price]', offre.prix)
      repeter(un(carte, '[data-offer-point]'), offre.points, (point, texte) => { point.textContent = texte })
      if (!offre.points.length) retirer(carte, '[data-offer-points]')
      action(un(carte, '[data-offer-action]'), offre.lienId ? 'ouvrir' : 'reserver', offre.lienId, c.boutonReserver)
    })
  } else {
    offres?.remove()
  }
}

function retirerLieu(doc: Document) {
  un(doc, '[data-place-wrap]')?.remove()
}

function retirerElement(el: Element | null) {
  el?.remove()
}
