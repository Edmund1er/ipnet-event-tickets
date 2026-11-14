import type { ContenuPage } from '../types'
import { action, ancre, ecrire, fond, image, logoTexte, menu, plage, plan, repeter, retirer, tous, un } from './outils'

/** Template « EventCon » : concert, soirée, fête. Fond noir, titre géant, timeline du programme. */
export function appliquerSoiree(doc: Document, c: ContenuPage) {
  // Modèle de bloc texte, copié avant que « À propos » ne soit rempli
  const modeleTexte = un(doc, '.about_area')?.cloneNode(true) as HTMLElement | undefined

  /* En-tête */
  logoTexte(doc, un(doc, '.logo a'), c.nomSite, "color:#fff;font-family:'Anton',sans-serif;text-transform:uppercase;font-size:26px")
  menu(un(doc, '#navigation'), c.menu)
  action(un(doc, '.buy_tkt .book_btn a'), 'reserver', null, c.boutonReserver)

  /* Hero */
  ecrire(doc, '.slider_text span', c.dateTexte)
  ecrire(doc, '.slider_text h3', c.titre)
  ecrire(doc, '.slider_text p', c.lieu ?? '')
  const titre = un(doc, '.slider_text h3')
  if (titre) titre.style.fontSize = c.titre.length > 28 ? '40px' : c.titre.length > 16 ? '64px' : ''
  if (c.imageHero) fond(un(doc, '.single_slider'), c.imageHero)

  /* Intervenants */
  const interv = un(doc, '.performar_area')
  if (interv && c.intervenants) {
    ancre(interv, 'intervenants')
    ecrire(interv, '.section_title h3', c.intervenants.titre)
    const colonne = un(interv, '.single_performer')?.closest<HTMLElement>('[class*="col-"]') ?? null
    repeter(colonne, c.intervenants.liste, (el, p) => {
      image(un(el, 'img'), p.photo, p.nom)
      ecrire(el, 'h4', p.nom)
      ecrire(el, 'span', p.role)
    })
  } else {
    retirer(doc, '.performar_area')
  }

  /* À propos + blocs de texte */
  const remplirTexte = (zone: HTMLElement, t: { titre: string; texte: string; image?: string; bouton?: string }, avecBouton: boolean) => {
    if (t.titre) ecrire(zone, '.section_title h3', t.titre)
    else retirer(zone, '.section_title')
    retirer(zone, '.section_title p')
    ecrire(zone, '.about_info h4', '')
    ecrire(zone, '.about_info p', t.texte)
    const bouton = un(zone, 'a.boxed-btn3')
    if (avecBouton) action(bouton, 'reserver', null, t.bouton)
    else bouton?.remove()
    if (t.image) {
      image(un(zone, '.thumb_inner img'), t.image)
    } else {
      un(zone, '.about_thumb')?.closest('[class*="col-"]')?.remove()
      const info = un(zone, '.about_info')?.closest<HTMLElement>('[class*="col-"]')
      if (info) info.className = 'col-lg-8 col-md-10 mx-auto text-center'
    }
  }
  const apropos = un(doc, '.about_area')
  let dernier: HTMLElement | null = apropos
  if (apropos && c.apropos) {
    ancre(apropos, 'apropos')
    remplirTexte(apropos, c.apropos, true)
    ecrire(apropos, '.about_info h4', c.dateTexte)
  } else {
    apropos?.remove()
    dernier = un(doc, '.performar_area') ?? un(doc, '.slider_area')
  }
  for (const t of c.textes) {
    if (!modeleTexte || !dernier) break
    const bloc = modeleTexte.cloneNode(true) as HTMLElement
    remplirTexte(bloc, t, false)
    dernier.after(bloc)
    dernier = bloc
  }

  /* Programme : timeline */
  const prog = un(doc, '.program_details_area')
  if (prog && c.programme) {
    ancre(prog, 'programme')
    ecrire(prog, '.section_title h3', c.programme.titre)
    const lignes = c.programme.jours.flatMap((j) => j.lignes.map((l) => ({ j, l })))
    repeter(un(prog, '.single_propram'), lignes, (el, { j, l }) => {
      ecrire(el, '.porgram_top span', plage(l.debut, l.fin))
      ecrire(el, '.porgram_top h4', j.dateLongue)
      retirer(el, '.thumb')
      ecrire(el, '.inner_wrap > h4', [l.titre, l.intervenant].filter(Boolean).join(' · '))
      if (l.lienId) {
        const zone = un(el, '.inner_wrap')
        action(zone, 'ouvrir', l.lienId)
        if (zone) zone.style.cursor = 'pointer'
      }
    })
  } else {
    retirer(doc, '.program_details_area')
  }

  /* Lieu : plan intégré + coordonnées */
  const carte = un(doc, '.map_area')
  if (carte && c.lieuInfos) {
    ancre(carte, 'lieu')
    retirer(carte, 'script')
    const zone = un(carte, '#map')
    if (zone) {
      zone.textContent = ''
      zone.style.height = '600px'
      zone.append(plan(doc, c.lieuInfos.adresse || c.lieu || c.titre))
    }
    ecrire(carte, 'h3', c.lieuInfos.titre)
    const valeurs: [string, string | undefined][] = [
      ['Lieu :', c.lieuInfos.adresse],
      ['Téléphone :', c.lieuInfos.telephone],
      ['E-mail :', c.lieuInfos.email],
    ]
    tous(carte, '.single_info').forEach((el, i) => {
      const [libelle, valeur] = valeurs[i] ?? []
      if (!valeur) return el.remove()
      ecrire(el, 'span', libelle)
      ecrire(el, 'p', valeur)
    })
  } else {
    retirer(doc, '.map_area')
  }
  retirer(doc, '.brand_area')

  /* Pied de page : appel à la réservation */
  ecrire(doc, '.address_details h4', c.dateTexte)
  ecrire(doc, '.address_details h3', c.lieu ?? c.titre)
  ecrire(doc, '.address_details p', c.accroche ?? c.titre)
  action(un(doc, '.address_details a.boxed-btn3'), 'reserver', null, c.boutonReserver)
  ancre(un(doc, 'footer'), 'billets')
}
