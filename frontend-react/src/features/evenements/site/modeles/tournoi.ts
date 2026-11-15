import type { ContenuPage } from '../types'
import { action, ancre, ecrire, image, imageHero, logoTexte, menu, plage, repeter, retirer, un } from './outils'

/** Template « Tournoi » : compétition sportive et e-sport, programme par journées et offres d'accès. */
export function appliquerTournoi(doc: Document, c: ContenuPage) {
  /* En-tête et navigation */
  logoTexte(doc, un(doc, '.brand'), c.nomSite)
  menu(un(doc, '.nav-list'), c.menu.length ? c.menu : [{ libelle: 'Accueil', ancre: 'hero' }])
  action(un(doc, '.header-cta'), 'reserver', null, c.boutonReserver)

  /* Hero */
  const hero = un(doc, '#hero')
  ancre(hero, 'hero')
  ecrire(doc, '#event-title', c.titre)
  ecrire(doc, '.hero-subtitle', c.accroche ?? '')
  ecrire(doc, '.event-date span', c.dateTexte)
  ecrire(doc, '.event-location span', c.lieu ?? '')
  if (!c.dateTexte) retirer(doc, '.event-date')
  if (!c.lieu) retirer(doc, '.event-location')
  if (!c.accroche) retirer(doc, '.hero-subtitle')
  if (c.imageHero) imageHero(hero, null, c.imageHero, c)
  action(un(doc, '.hero-cta'), 'reserver', null, c.boutonHero)

  /* À propos */
  const texteApropos = c.apropos?.texte ?? c.accroche
  const titreApropos = c.apropos?.titre ?? 'À propos du tournoi'
  const apropos = un(doc, '#apropos')
  if (apropos && texteApropos) {
    ancre(apropos, 'apropos')
    ecrire(apropos, '.about-title', titreApropos)
    ecrire(apropos, '.about-copy', texteApropos)
    ecrire(apropos, '.about-date', c.dateTexte)
    ecrire(apropos, '.about-location', c.lieu ?? '')
    if (!c.lieu) un(apropos, '.about-location')?.closest('.info-cell')?.remove()
    if (c.apropos?.image) {
      image(un(apropos, '.about-image'), c.apropos.image, titreApropos)
    } else {
      retirer(apropos, '.about-image-wrap')
    }
    if (c.apropos?.bouton) action(un(apropos, '.about-cta'), 'reserver', null, c.apropos.bouton)
    else retirer(apropos, '.about-action')
  } else {
    apropos?.remove()
  }

  /* Intervenants / capitaines / invités */
  const intervenants = un(doc, '#intervenants')
  if (intervenants && c.intervenants?.liste.length) {
    ecrire(intervenants, '.speakers-title', c.intervenants.titre)
    if (c.intervenants.sousTitre) ecrire(intervenants, '.speakers-subtitle', c.intervenants.sousTitre)
    else retirer(intervenants, '.speakers-subtitle')
    repeter(un(intervenants, '.speaker-card'), c.intervenants.liste, (card, personne) => {
      const portrait = un(card, 'img')
      if (personne.photo) image(portrait, personne.photo, personne.nom)
      else portrait?.remove()
      ecrire(card, 'h3', personne.nom)
      if (personne.role) ecrire(card, '.speaker-copy p', personne.role)
      else retirer(card, '.speaker-copy p')
    })
  } else {
    intervenants?.remove()
  }

  /* Programme : navigation par ancres et détail des journées et des rencontres. */
  const programme = un(doc, '#programme')
  if (programme && c.programme?.jours.length) {
    ecrire(programme, '.schedule-title', c.programme.titre)
    if (c.programme.sousTitre) ecrire(programme, '.schedule-subtitle', c.programme.sousTitre)
    else retirer(programme, '.schedule-subtitle')
    repeter(un(programme, '.day-link'), c.programme.jours, (lien, jour, index) => {
      const cible = `tournoi-jour-${index + 1}`
      lien.textContent = jour.etiquette || jour.dateLongue
      lien.setAttribute('href', `#${cible}`)
      lien.setAttribute('aria-label', `Voir le programme du ${jour.dateLongue}`)
    })
    repeter(un(programme, '.day-card'), c.programme.jours, (bloc, jour, index) => {
      bloc.id = `tournoi-jour-${index + 1}`
      ecrire(bloc, 'h3', jour.dateLongue || jour.etiquette)
      repeter(un(bloc, '.match-card'), jour.lignes, (ligne, activite) => {
        ecrire(ligne, '.match-time', plage(activite.debut, activite.fin))
        ecrire(ligne, 'h4', activite.titre)
        if (activite.description) ecrire(ligne, '.match-description', activite.description)
        else retirer(ligne, '.match-description')
        if (activite.lieu) ecrire(ligne, '.match-location', activite.lieu)
        else retirer(ligne, '.match-location')
        if (activite.intervenant) {
          const info = doc.createElement('p')
          info.className = 'match-speaker'
          info.textContent = activite.intervenant
          un(ligne, '.match-details')?.append(info)
        }
        if (activite.lienId) {
          action(ligne, 'ouvrir', activite.lienId)
          ligne.setAttribute('aria-label', `Ouvrir ${activite.titre}`)
        }
      })
    })
  } else {
    programme?.remove()
  }

  /* Lieu : uniquement des informations textuelles, sans carte ni ressource distante. */
  const lieuInfos = c.lieuInfos
  const zoneLieu = un(doc, '#lieu')
  if (zoneLieu && (lieuInfos || c.lieu)) {
    ecrire(zoneLieu, '.venue-title', lieuInfos?.titre || 'Lieu de la compétition')
    ecrire(zoneLieu, '.venue-address', lieuInfos?.adresse || c.lieu || '')
    if (lieuInfos?.texte) ecrire(zoneLieu, '.venue-description', lieuInfos.texte)
    else retirer(zoneLieu, '.venue-description')
    const contacts = [lieuInfos?.telephone, lieuInfos?.email].filter(Boolean)
    if (contacts.length) ecrire(zoneLieu, '.venue-contact', contacts.join(' · '))
    else retirer(zoneLieu, '.venue-contact')
  } else {
    zoneLieu?.remove()
  }

  /* Billets et pass */
  const offres = un(doc, '#billets')
  if (offres && c.offres.length) {
    ecrire(offres, '.offers-title', c.offres.some((offre) => offre.lienId) ? 'Choisissez votre pass' : 'Réservez votre place')
    repeter(un(offres, '.offer-card'), c.offres, (carte, offre, index) => {
      carte.classList.toggle('featured', c.offres.length > 1 ? index === 1 : true)
      ecrire(carte, 'h3', offre.nom)
      ecrire(carte, '.offer-price', offre.prix)
      repeter(un(carte, 'li'), offre.points, (point, texte) => { point.textContent = texte })
      action(un(carte, '.offer-cta'), offre.lienId ? 'ouvrir' : 'reserver', offre.lienId, offre.lienId ? 'Découvrir ce pass' : c.boutonReserver)
    })
  } else {
    offres?.remove()
  }

  /* Blocs de texte complémentaires, sans contenu de démonstration dans le squelette. */
  const zoneTextes = un(doc, '.text-sections')
  if (zoneTextes) {
    for (const texte of c.textes) {
      const section = doc.createElement('section')
      section.className = 'text-block'
      section.id = texte.id
      const titre = doc.createElement('h2')
      titre.textContent = texte.titre
      const paragraphe = doc.createElement('p')
      paragraphe.textContent = texte.texte
      section.append(titre, paragraphe)
      if (texte.image) {
        const visuel = doc.createElement('img')
        visuel.className = 'about-image'
        image(visuel, texte.image, texte.titre)
        section.append(visuel)
      }
      zoneTextes.append(section)
    }
  }

  /* Pied de page */
  ecrire(doc, '.footer-name', c.nomSite)
  ecrire(doc, '.footer-copy', `© ${new Date().getFullYear()} ${c.nomSite} — Tous droits réservés`)
}
