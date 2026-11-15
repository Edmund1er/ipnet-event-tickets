import type { ContenuPage } from '../types'
import { action, ancre, ecrire, fond, image, logoTexte, menu, plage, repeter, retirer, un } from './outils'

/** Adapte le squelette « Réseautage » aux données de la page événement. */
export function appliquerReseautage(doc: Document, c: ContenuPage) {
  if (c.couleurPrincipale) doc.documentElement.style.setProperty('--ipnet-primary', c.couleurPrincipale)
  if (c.couleurSecondaire) doc.documentElement.style.setProperty('--ipnet-secondary', c.couleurSecondaire)
  doc.title = [c.titre, c.nomSite].filter(Boolean).join(' — ')

  /* En-tête et navigation : les liens ne pointent que vers des sections présentes. */
  logoTexte(doc, un(doc, '.rn-brand'), c.nomSite, 'color:var(--ipnet-primary, #176c60)')
  action(un(doc, '.rn-header-cta'), 'reserver', null, c.boutonReserver)
  const navItems: { libelle: string; ancre: string }[] = []
  const ajouterNavigation = (id: string, libelle: string, presente: boolean) => {
    if (!presente) return
    const config = c.menu.find((item) => item.ancre === id)
    navItems.push({ libelle: config?.libelle || libelle, ancre: id })
  }

  /* Hero */
  ancre(un(doc, '.rn-hero'), 'hero')
  ecrire(doc, '#rn-title', c.titre)
  ecrire(doc, '.rn-hero-date', c.dateTexte)
  const lieu = c.lieu || c.lieuInfos?.adresse
  if (lieu) ecrire(doc, '.rn-hero-location', lieu)
  else retirer(doc, '.rn-hero-location')
  action(un(doc, '.rn-hero-cta'), 'reserver', null, c.boutonHero)
  if (c.imageHero) fond(un(doc, '.rn-hero-art'), c.imageHero, c)

  /* Présentation */
  const texteApropos = c.apropos?.texte || c.accroche
  const titreApropos = c.apropos?.titre || 'À propos de cette rencontre'
  const aProposPresent = Boolean(texteApropos || c.apropos?.titre)
  const sectionApropos = un(doc, '.rn-about')
  if (aProposPresent) {
    ancre(sectionApropos, 'apropos')
    ecrire(doc, '#rn-about-title', titreApropos)
    if (texteApropos) ecrire(doc, '.rn-about-copy', texteApropos)
    else retirer(doc, '.rn-about-copy')
  } else {
    sectionApropos?.remove()
  }
  ajouterNavigation('apropos', 'À propos', aProposPresent)

  /* Intervenants et personnes à rencontrer */
  const intervenants = c.intervenants
  const listeIntervenants = intervenants?.liste ?? []
  const sectionPersonnes = un(doc, '.rn-people')
  const personnesPresentes = listeIntervenants.length > 0
  if (personnesPresentes) {
    ancre(sectionPersonnes, 'intervenants')
    ecrire(doc, '#rn-people-title', intervenants?.titre || 'Intervenants')
    if (intervenants?.sousTitre) ecrire(doc, '.rn-people-subtitle', intervenants.sousTitre)
    else retirer(doc, '.rn-people-subtitle')
    repeter(un(doc, '.rn-speaker'), listeIntervenants, (carte, personne) => {
      const photo = un(carte, '.rn-speaker-photo')
      if (personne.photo) image(photo, personne.photo, personne.nom)
      else photo?.remove()
      ecrire(carte, 'h3', personne.nom)
      if (personne.role) ecrire(carte, 'p', personne.role)
      else retirer(carte, 'p')
    })
  } else {
    sectionPersonnes?.remove()
  }
  ajouterNavigation('intervenants', intervenants?.titre || 'Intervenants', personnesPresentes)

  /* Programme par journée et créneaux */
  const programme = c.programme
  const jours = programme?.jours ?? []
  const sectionProgramme = un(doc, '.rn-programme')
  const programmePresent = jours.length > 0
  if (programmePresent) {
    ancre(sectionProgramme, 'programme')
    ecrire(doc, '#rn-programme-title', programme?.titre || 'Programme')
    if (programme?.sousTitre) ecrire(doc, '.rn-programme-subtitle', programme.sousTitre)
    else retirer(doc, '.rn-programme-subtitle')
    repeter(un(doc, '.rn-day'), jours, (jourEl, jour) => {
      ecrire(jourEl, '.rn-day-date p', jour.dateLongue || jour.etiquette)
      repeter(un(jourEl, '.rn-row'), jour.lignes, (ligneEl, ligne) => {
        ecrire(ligneEl, 'h3', ligne.titre)
        ecrire(ligneEl, 'time', plage(ligne.debut, ligne.fin))
        const description = [ligne.description, ligne.intervenant].filter(Boolean).join(' — ')
        if (description) ecrire(ligneEl, '.rn-row-description', description)
        else retirer(ligneEl, '.rn-row-description')
        if (ligne.lieu) ecrire(ligneEl, '.rn-row-place', ligne.lieu)
        else retirer(ligneEl, '.rn-row-place')
        if (ligne.lienId != null) action(ligneEl, 'ouvrir', ligne.lienId)
      })
    })
  } else {
    sectionProgramme?.remove()
  }
  ajouterNavigation('programme', programme?.titre || 'Programme', programmePresent)

  /* Lieu et contacts pratiques */
  const infosLieu = c.lieuInfos
  const sectionLieu = un(doc, '.rn-venue')
  const lieuPresent = !!infosLieu
  if (sectionLieu && infosLieu) {
    ancre(sectionLieu, 'lieu')
    ecrire(sectionLieu, '#rn-venue-title', infosLieu.titre || 'Lieu')
    ecrire(sectionLieu, '.rn-venue-address', infosLieu.adresse || c.lieu || '')
    if (infosLieu.texte) ecrire(sectionLieu, '.rn-venue-description', infosLieu.texte)
    else retirer(sectionLieu, '.rn-venue-description')
    const contact = [infosLieu.telephone, infosLieu.email].filter(Boolean).join(' · ')
    if (contact) ecrire(sectionLieu, '.rn-venue-contact', contact)
    else retirer(sectionLieu, '.rn-venue-contact')
    const imageLieu = un(sectionLieu, '.rn-venue-image')
    if (infosLieu.image) image(imageLieu, infosLieu.image, infosLieu.titre || 'Visuel du lieu')
    else imageLieu?.remove()
  } else {
    sectionLieu?.remove()
  }
  ajouterNavigation('lieu', infosLieu?.titre || 'Lieu', lieuPresent)

  /* Billets et pass */
  const sectionOffres = un(doc, '.rn-offers')
  const offresPresentes = c.offres.length > 0
  if (offresPresentes) {
    ancre(sectionOffres, 'billets')
    ecrire(doc, '#rn-offers-title', c.offres.some((offre) => offre.lienId != null) ? 'Choisissez votre pass' : 'Réservez votre place')
    repeter(un(doc, '.rn-offer'), c.offres, (carte, offre) => {
      ecrire(carte, 'h3', offre.nom)
      ecrire(carte, '.rn-price', offre.prix)
      const liste = un(carte, 'ul')
      if (offre.points.length) {
        repeter(un(carte, 'li'), offre.points, (point, texte) => { point.textContent = texte })
      } else {
        liste?.remove()
      }
      action(un(carte, '.rn-offer-cta'), offre.lienId != null ? 'ouvrir' : 'reserver', offre.lienId, c.boutonReserver)
    })
  } else {
    sectionOffres?.remove()
  }
  ajouterNavigation('billets', 'Billets et pass', offresPresentes)

  const nav = un(doc, '.rn-nav')
  if (nav && navItems.length) menu(un(nav, 'ul'), navItems)
  else nav?.remove()
}
