import { avatar } from '../contenu'
import type { ContenuPage } from '../types'
import { action, ancre, ecrire, fond, image, logoTexte, menu, miniature, plage, repeter, retirer, tous, un } from './outils'

/** Template « Wemeet » : forum, hackathon, rencontre. Dégradé coloré, compte à rebours, programme par jour. */
export function appliquerRencontre(doc: Document, c: ContenuPage) {
  const modeleTexte = un(doc, '.about_area')?.cloneNode(true) as HTMLElement | undefined

  /* En-tête */
  logoTexte(doc, un(doc, '.logo-img a'), c.nomSite, 'color:#fff;font-size:26px')
  menu(un(doc, '#navigation'), c.menu)
  action(un(doc, '.buy_ticket a'), 'reserver', null, c.boutonReserver)

  /* Hero */
  const hero = un(doc, '.slider_area')
  if (c.imageHero) fond(hero, c.imageHero)
  ecrire(doc, '.opcity_text', c.titre.split(/\s+/)[0].slice(0, 14).toUpperCase())
  const titre = un(doc, '.title_text h3')
  if (titre) {
    titre.textContent = c.titre
    if (c.titre.length > 40) titre.style.fontSize = '44px'
  }
  action(un(doc, '.title_text a'), 'reserver', null, c.boutonHero)
  const dates = tous(doc, '.countDOwn_area .single_date')
  if (dates[0]) {
    if (c.lieu) ecrire(dates[0], 'span', c.lieu)
    else dates[0].closest('[class*="col-"]')?.remove()
  }
  if (dates[1]) ecrire(dates[1], 'span', c.dateTexte)

  /* À propos + blocs de texte */
  const remplirTexte = (zone: HTMLElement, t: { titre: string; texte: string; image?: string; bouton?: string }, avecBouton: boolean) => {
    ecrire(zone, '.sub_heading', c.dateTexte)
    ecrire(zone, '.about_info h3', t.titre)
    ecrire(zone, '.about_info p', t.texte)
    const bouton = un(zone, 'a.boxed-btn-red')
    if (avecBouton) action(bouton, 'reserver', null, t.bouton)
    else bouton?.remove()
    if (t.image) image(un(zone, '.about_thumb img'), t.image)
    else {
      retirer(zone, '.shape-1', '.shape-2')
      un(zone, '.about_thumb')?.closest('[class*="col-"]')?.remove()
      const info = un(zone, '.about_info')?.closest<HTMLElement>('[class*="col-"]')
      if (info) info.className = 'col-xl-8 col-md-10 mx-auto'
    }
  }
  const apropos = un(doc, '.about_area')
  let dernier: HTMLElement | null = apropos
  if (apropos && c.apropos) {
    ancre(apropos, 'apropos')
    remplirTexte(apropos, c.apropos, true)
  } else {
    apropos?.remove()
    dernier = un(doc, '.slider_area')
  }
  for (const t of c.textes) {
    if (!modeleTexte || !dernier) break
    const bloc = modeleTexte.cloneNode(true) as HTMLElement
    remplirTexte(bloc, t, false)
    dernier.after(bloc)
    dernier = bloc
  }

  /* Intervenants : deux colonnes décalées, remplies en alternance */
  const sp = un(doc, '.speakers_area')
  if (sp && c.intervenants) {
    ancre(sp, 'intervenants')
    ecrire(sp, '.serction_title_large h3', c.intervenants.titre)
    ecrire(sp, '.horizontal_text', c.intervenants.titre)
    const modele = un(sp, '.single_speaker')
    const colonnes = tous(sp, '.row > [class*="col-xl-5"]')
    if (modele && colonnes.length > 0) {
      colonnes.forEach((col) => (col.textContent = ''))
      c.intervenants.liste.forEach((p, i) => {
        const el = modele.cloneNode(true) as HTMLElement
        image(un(el, 'img'), p.photo, p.nom)
        ecrire(el, '.speaker_name h3', p.nom)
        ecrire(el, '.speaker_name p', p.role)
        retirer(el, '.hover_overlay')
        colonnes[i % colonnes.length].append(el)
      })
    }
  } else {
    retirer(doc, '.speakers_area')
  }

  /* Programme par jour */
  const ev = un(doc, '.event_area')
  if (ev && c.programme) {
    ancre(ev, 'programme')
    ecrire(ev, '.vr_text', c.programme.titre)
    repeter(un(ev, '.double_line'), c.programme.jours, (ligneJour, j) => {
      ecrire(ligneJour, '.date h3', j.dateLongue)
      repeter(un(ligneJour, '.single_speaker'), j.lignes, (row, l) => {
        const photo = un(row, 'img')
        if (l.intervenant) miniature(photo, avatar(l.intervenant), l.intervenant, 64)
        else photo?.remove()
        ecrire(row, '.heading span', l.titre)
        ecrire(row, '.time', plage(l.debut, l.fin))
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
    retirer(doc, '.event_area')
  }

  /* Appel à la réservation */
  const reg = un(doc, '.resister_book')
  if (reg) {
    ancre(reg, 'billets')
    ecrire(reg, '.resister_text h3', c.offres.some((o) => o.lienId) ? 'Choisissez votre pass' : 'Réservez votre place')
    const premier = c.offres[0]
    action(un(reg, 'a'), c.offres.length === 1 && !premier?.lienId ? 'reserver' : 'reserver', null, premier ? `${c.boutonReserver} · ${premier.prix}` : c.boutonReserver)
  }

  retirer(doc, '.brand_area', '.faq_area')

  /* Pied de page : lieu et contact */
  const widgets = tous(doc, '.footer_top .footer_widget')
  widgets.slice(0, 2).forEach((w) => w.closest('[class*="col-"]')?.remove())
  const lieu = widgets[2]
  if (lieu) {
    ecrire(lieu, '.footer_title', c.lieuInfos?.titre ?? 'Lieu')
    const p = un(lieu, 'p')
    if (p) {
      p.textContent = ''
      const lignes = [c.lieuInfos?.adresse ?? c.lieu, c.lieuInfos?.telephone, c.lieuInfos?.email].filter(Boolean) as string[]
      lignes.forEach((t, i) => {
        if (i > 0) p.append(doc.createElement('br'))
        p.append(doc.createTextNode(t))
      })
    }
  }
}
