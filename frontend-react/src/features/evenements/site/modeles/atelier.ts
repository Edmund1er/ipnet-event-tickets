import type { ContenuPage } from '../types'
import { action, ancre, ecrire, image, imageHero, logoTexte, menu, plage, repeter, retirer, un } from './outils'

/** Page de festival de la jeunesse : animations, expériences et programmation en plusieurs temps. */
export function appliquerAtelier(doc: Document, c: ContenuPage) {
  logoTexte(doc, un(doc, '.atelier-brand'), c.nomSite, 'color:inherit;font-size:20px')
  menu(un(doc, '#atelier-nav'), c.menu)
  action(un(doc, '.atelier-header__cta'), 'reserver', null, c.boutonReserver)

  const hero = un(doc, '#atelier-hero')
  ancre(hero, 'hero')
  ecrire(hero ?? doc, '.atelier-hero__eyebrow', 'Festival de la jeunesse')
  if (c.accroche) ecrire(hero ?? doc, '.atelier-hero__summary', c.accroche)
  else retirer(hero ?? doc, '.atelier-hero__summary')
  ecrire(hero ?? doc, 'h1', c.titre)
  ecrire(hero ?? doc, '.atelier-hero__date', c.dateTexte)
  ecrire(hero ?? doc, '.atelier-hero__location', c.lieu ?? '')
  if (!c.lieu) retirer(hero ?? doc, '.atelier-hero__location-wrap')
  if (c.imageHero) imageHero(hero, null, c.imageHero, c)
  action(un(doc, '.atelier-hero__cta'), 'reserver', null, c.boutonHero)
  retirer(doc, '.atelier-hero__note', '.atelier-hero__foot')

  const apropos = un(doc, '#apropos')
  if (apropos && c.apropos) {
    ancre(apropos, 'apropos')
    ecrire(apropos, 'h2', c.apropos.titre || 'À propos de l’atelier')
    ecrire(apropos, '.atelier-about__text', c.apropos.texte)
    const photo = un(apropos, '.atelier-about__image')
    if (c.apropos.image) image(photo, c.apropos.image, c.apropos.titre)
    else photo?.remove()
    action(un(apropos, '.atelier-about__cta'), 'reserver', null, c.apropos.bouton || c.boutonReserver)
  } else {
    retirer(doc, '#apropos')
  }

  const intervenants = un(doc, '#intervenants')
  if (intervenants && c.intervenants?.liste.length) {
    ancre(intervenants, 'intervenants')
    ecrire(intervenants, 'h2', c.intervenants.titre === 'Intervenants' ? 'Line-up & invités' : c.intervenants.titre)
    if (c.intervenants.sousTitre) ecrire(intervenants, '.atelier-section__intro', c.intervenants.sousTitre)
    else retirer(intervenants, '.atelier-section__intro')
    repeter(un(intervenants, '.atelier-speaker'), c.intervenants.liste, (el, personne) => {
      image(un(el, 'img'), personne.photo, personne.nom)
      ecrire(el, '.atelier-speaker__name', personne.nom)
      if (personne.role) ecrire(el, '.atelier-speaker__role', personne.role)
      else retirer(el, '.atelier-speaker__role')
    })
  } else {
    retirer(doc, '#intervenants')
  }

  const programme = un(doc, '#programme')
  if (programme && c.programme?.jours.length) {
    ancre(programme, 'programme')
    ecrire(programme, 'h2', c.programme.titre)
    if (c.programme.sousTitre) ecrire(programme, '.atelier-section__intro', c.programme.sousTitre)
    else retirer(programme, '.atelier-section__intro')
    repeter(un(programme, '.atelier-day'), c.programme.jours, (day, jour, index) => {
      day.id = `jour-${index + 1}`
      ecrire(day, '.atelier-day__label', jour.etiquette)
      ecrire(day, '.atelier-day__date', jour.dateLongue)
      repeter(un(day, '.atelier-session'), jour.lignes, (row, ligne) => {
        ecrire(row, '.atelier-session__time', plage(ligne.debut, ligne.fin))
        ecrire(row, '.atelier-session__title', ligne.titre)
        const details = [ligne.description, ligne.lieu, ligne.intervenant].filter(Boolean).join(' · ')
        if (details) ecrire(row, '.atelier-session__details', details)
        else retirer(row, '.atelier-session__details')
        if (ligne.lienId) {
          action(row, 'ouvrir', ligne.lienId)
          row.setAttribute('aria-label', `Ouvrir l’activité : ${ligne.titre}`)
        }
      })
      if (!jour.lignes.length) retirer(day, '.atelier-day__sessions')
    })
  } else {
    retirer(doc, '#programme')
  }

  const lieu = un(doc, '#lieu')
  if (lieu && c.lieuInfos) {
    ancre(lieu, 'lieu')
    ecrire(lieu, 'h2', c.lieuInfos.titre || 'Lieu')
    ecrire(lieu, '.atelier-venue__address', c.lieuInfos.adresse || c.lieu || '')
    const precision = [c.lieuInfos.texte, c.lieuInfos.telephone, c.lieuInfos.email].filter(Boolean).join(' · ')
    if (precision) ecrire(lieu, '.atelier-venue__details', precision)
    else retirer(lieu, '.atelier-venue__details')
    const visuel = un(lieu, '.atelier-venue__image')
    if (c.lieuInfos.image) image(visuel, c.lieuInfos.image, c.lieuInfos.titre)
    else visuel?.remove()
  } else {
    retirer(doc, '#lieu')
  }

  const billets = un(doc, '#billets')
  if (billets && c.offres.length) {
    ancre(billets, 'billets')
    ecrire(billets, 'h2', c.offres.some((offre) => offre.lienId) ? 'Choisir un pass' : 'Réserver mon accès')
    repeter(un(billets, '.atelier-offer'), c.offres, (offreEl, offre, index) => {
      offreEl.classList.toggle('atelier-offer--featured', index === 1)
      ecrire(offreEl, '.atelier-offer__name', offre.nom)
      ecrire(offreEl, '.atelier-offer__price', offre.prix)
      repeter(un(offreEl, '.atelier-offer__point'), offre.points, (li, point) => { li.textContent = point })
      action(un(offreEl, '.atelier-offer__cta'), offre.lienId ? 'ouvrir' : 'reserver', offre.lienId, offre.lienId ? 'Voir cette offre' : c.boutonReserver)
    })
  } else {
    retirer(doc, '#billets')
  }

  const textes = un(doc, '#atelier-textes')
  if (textes && c.textes.length) {
    repeter(un(textes, '.atelier-text'), c.textes, (bloc, t) => {
      bloc.id = t.id
      ecrire(bloc, 'h2', t.titre)
      ecrire(bloc, 'p', t.texte)
      const visuel = un(bloc, 'img')
      if (t.image) image(visuel, t.image, t.titre)
      else visuel?.remove()
    })
  } else {
    retirer(doc, '#atelier-textes')
  }

  ecrire(doc, '.atelier-footer__name', c.nomSite)
  ecrire(doc, '.atelier-footer__date', c.dateTexte)
  ecrire(doc, '.atelier-footer__location', c.lieu ?? '')
  if (!c.lieu) retirer(doc, '.atelier-footer__location')
  ecrire(doc, '.atelier-footer__copyright', `© ${new Date().getFullYear()} ${c.nomSite} — Tous droits réservés`)
}
