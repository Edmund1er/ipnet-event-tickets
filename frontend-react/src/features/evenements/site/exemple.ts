import type { Evenement } from '../../../core/api/types'
import type { CleModele, CreneauConfig, PageConfig } from './types'

interface ExempleModele {
  titre: string
  sousTitre: string
  description: string
  lieu: string
  accroche: string
  ambiance: string
  prix: number
  intervenants: { nom: string; role: string }[]
  creneaux: Omit<CreneauConfig, 'jour'>[]
  secondJour?: boolean
}

/** Contenus clairement fictifs pour prévisualiser chaque univers sans réutiliser les textes de démo des vendors. */
const EXEMPLES: Record<CleModele, ExempleModele> = {
  SOIREE: {
    titre: 'Nuit des Vibes — Lomé', sousTitre: 'DJ sets, danse et good vibes jusqu’au bout de la nuit',
    description: 'Une nuit pour se retrouver, découvrir les artistes locaux et danser avec sa team.', lieu: 'Lomé, Togo', accroche: 'Une nuit de musique, de danse et de rencontres.', ambiance: 'SOIREE', prix: 2000,
    intervenants: [{ nom: 'DJ invité', role: 'Afrobeats & hits' }, { nom: 'Artiste local', role: 'Showcase live' }],
    creneaux: [
      { debut: '19:00', fin: '20:00', titre: 'Ouverture des portes', description: 'Accueil et retrouvailles', lieu: 'Entrée principale' },
      { debut: '20:00', fin: '22:00', titre: 'Showcase live', intervenant: 'Artiste local', lieu: 'Scène principale' },
      { debut: '22:00', fin: '02:00', titre: 'DJ set', intervenant: 'DJ invité', lieu: 'Piste de danse' },
    ],
  },
  CONFERENCE: {
    titre: 'Live Session — Rap & Afrobeats', sousTitre: 'Showcase, freestyle et scène ouverte',
    description: 'Une scène pour les artistes, les freestyles et les sons qui font bouger Lomé.', lieu: 'Scène principale · Lomé', accroche: 'Le live au premier plan.', ambiance: 'URBAIN', prix: 1500,
    intervenants: [{ nom: 'Artiste invité', role: 'Showcase' }, { nom: 'DJ invité', role: 'Warm-up' }, { nom: 'MC invité', role: 'Freestyle' }],
    creneaux: [
      { debut: '18:00', fin: '19:00', titre: 'Ouverture & warm-up', intervenant: 'DJ invité', lieu: 'Scène principale' },
      { debut: '19:00', fin: '21:00', titre: 'Showcase rap', intervenant: 'Artiste invité', lieu: 'Scène principale' },
      { debut: '21:00', fin: '22:00', titre: 'Freestyle ouvert', intervenant: 'MC invité', lieu: 'Scène principale' },
    ],
  },
  RENCONTRE: {
    titre: 'Beach Day — Plage & Chill', sousTitre: 'Soleil, jeux et baignade avec ta team',
    description: 'Une journée au bord de l’eau : rendez-vous, jeux de plage, pause repas et coucher de soleil.', lieu: 'Plage à confirmer · Lomé', accroche: 'Cap sur la plage.', ambiance: 'PLAGE', prix: 1000,
    intervenants: [{ nom: 'Team animation', role: 'Jeux de plage' }, { nom: 'DJ invité', role: 'Sunset set' }],
    creneaux: [
      { debut: '07:00', fin: '08:00', titre: 'Rendez-vous & départ', description: 'Point de rassemblement à confirmer', lieu: 'Lomé' },
      { debut: '09:00', fin: '11:30', titre: 'Beach volley & jeux', intervenant: 'Team animation' },
      { debut: '12:00', fin: '14:00', titre: 'Pause déjeuner', description: 'Pique-nique et temps libre' },
      { debut: '16:00', fin: '18:00', titre: 'Baignade & sunset', intervenant: 'DJ invité' },
    ],
  },
  CEREMONIE: {
    titre: 'Bal sous les étoiles', sousTitre: 'Une soirée habillée, du dîner à la piste de danse',
    description: 'Un bal festif avec dîner, musique live et soirée dansante.', lieu: 'Lieu à confirmer · Lomé', accroche: 'Une soirée pour briller et célébrer.', ambiance: 'CEREMONIE', prix: 5000,
    intervenants: [{ nom: 'Groupe live', role: 'Musique' }, { nom: 'DJ invité', role: 'Dance floor' }],
    creneaux: [
      { debut: '18:00', fin: '19:00', titre: 'Accueil photo', lieu: 'Entrée principale' },
      { debut: '19:00', fin: '21:00', titre: 'Dîner & moments forts', lieu: 'Salle principale' },
      { debut: '21:00', fin: '01:00', titre: 'Bal & dance floor', intervenant: 'Groupe live · DJ invité' },
    ],
  },
  ATELIER: {
    titre: 'Escapade Nature — Plein air', sousTitre: 'Balade, pique-nique et activités au vert',
    description: 'Une journée dehors pour respirer, marcher, jouer et partager un repas en plein air.', lieu: 'Site naturel à confirmer · Togo', accroche: 'On prend l’air ensemble.', ambiance: 'NATURE', prix: 1000,
    intervenants: [{ nom: 'Team outdoor', role: 'Guide de la sortie' }, { nom: 'Team animation', role: 'Jeux & activités' }],
    creneaux: [
      { debut: '07:00', fin: '08:00', titre: 'Rendez-vous & départ', lieu: 'Point de rassemblement à confirmer' },
      { debut: '09:00', fin: '11:30', titre: 'Balade et découverte', intervenant: 'Team outdoor' },
      { debut: '12:00', fin: '14:00', titre: 'Pique-nique au vert', description: 'Pause repas et détente' },
      { debut: '14:00', fin: '16:00', titre: 'Jeux & activités', intervenant: 'Team animation' },
    ],
  },
  TOURNOI: {
    titre: 'Tournoi Play & Move', sousTitre: 'Du jeu, du sport et des défis entre équipes',
    description: 'Un rendez-vous pour jouer, encourager son équipe et profiter des animations.', lieu: 'Terrain à confirmer · Lomé', accroche: 'Que la meilleure team gagne.', ambiance: 'SPORT', prix: 500,
    intervenants: [{ nom: 'MC invité', role: 'Animation' }, { nom: 'DJ invité', role: 'Set de clôture' }], secondJour: true,
    creneaux: [
      { debut: '09:00', fin: '12:00', titre: 'Qualifications', intervenant: 'MC invité' },
      { debut: '14:00', fin: '17:00', titre: 'Demi-finales & défis', intervenant: 'MC invité' },
      { debut: '18:00', fin: '20:00', titre: 'Finale & remise des prix', lieu: 'Scène principale' },
    ],
  },
  SALON: {
    titre: 'Gospel Sunset — Live', sousTitre: 'Une soirée de musique, de partage et de lumière',
    description: 'Des voix, un groupe live et une belle soirée à partager ensemble.', lieu: 'Lieu à confirmer · Lomé', accroche: 'Les voix se retrouvent en live.', ambiance: 'GOSPEL', prix: 1500,
    intervenants: [{ nom: 'Chorale invitée', role: 'Gospel live' }, { nom: 'Artiste invité', role: 'Guest live' }],
    creneaux: [
      { debut: '17:00', fin: '18:00', titre: 'Ouverture des portes', lieu: 'Entrée principale' },
      { debut: '18:00', fin: '20:00', titre: 'Gospel live', intervenant: 'Chorale invitée' },
      { debut: '20:00', fin: '21:00', titre: 'Guest & clôture', intervenant: 'Artiste invité' },
    ],
  },
  LAGON: {
    titre: 'Sortie à la plage', sousTitre: 'Une journée de soleil et de vagues',
    description: 'Une journée au bord de l’eau : baignade, jeux de plage et déjeuner partagé.', lieu: 'Plage de Lomé, Togo', accroche: 'Sable, soleil, bonne humeur.', ambiance: 'PLAGE', prix: 2000,
    intervenants: [{ nom: 'Équipe animation', role: 'Jeux de plage' }],
    creneaux: [
      { debut: '08:00', fin: '09:00', titre: 'Départ et accueil', lieu: 'Point de rendez-vous' },
      { debut: '10:00', fin: '13:00', titre: 'Baignade et jeux', lieu: 'Plage' },
      { debut: '13:00', fin: '15:00', titre: 'Déjeuner', lieu: 'Plage' },
    ],
  },
  FORET: {
    titre: 'Escapade nature', sousTitre: 'Une journée au grand air',
    description: 'Randonnée, découverte de la nature et pique-nique en groupe.', lieu: 'Kpalimé, Togo', accroche: 'Respirez.', ambiance: 'NATURE', prix: 2000,
    intervenants: [{ nom: 'Guide local', role: 'Randonnée' }],
    creneaux: [
      { debut: '07:30', fin: '08:30', titre: 'Départ', lieu: 'Point de rendez-vous' },
      { debut: '09:00', fin: '12:00', titre: 'Randonnée', lieu: 'Sentier' },
      { debut: '12:30', fin: '14:00', titre: 'Pique-nique' },
    ],
  },
  FORUM: {
    titre: 'Forum IPNET', sousTitre: 'Rencontres et échanges',
    description: 'Conférences et ateliers avec des intervenants invités.', lieu: 'IPNET Institute, Lomé', accroche: 'Apprendre ensemble.', ambiance: 'CULTURE', prix: 0,
    intervenants: [{ nom: 'Intervenant invité', role: 'Keynote' }],
    creneaux: [
      { debut: '09:00', fin: '10:00', titre: 'Ouverture', lieu: 'Amphi' },
      { debut: '10:00', fin: '12:00', titre: 'Conférence', intervenant: 'Intervenant invité' },
    ],
  },
  RESEAUTAGE: {
    titre: 'Sunset Club — DJ Night', sousTitre: 'Le coucher du soleil ouvre la nuit',
    description: 'Une nuit électro et afrobeats avec un line-up de DJs et un dance floor ouvert.', lieu: 'Lomé, Togo', accroche: 'Du sunset au dernier son.', ambiance: 'ELECTRO', prix: 2000,
    intervenants: [{ nom: 'DJ invité', role: 'Sunset set' }, { nom: 'DJ invité', role: 'Late night' }],
    creneaux: [
      { debut: '18:00', fin: '20:00', titre: 'Sunset warm-up', intervenant: 'DJ invité' },
      { debut: '20:00', fin: '23:00', titre: 'Club set', intervenant: 'DJ invité' },
      { debut: '23:00', fin: '02:00', titre: 'Late night', lieu: 'Dance floor' },
    ],
  },
}

const jour = (decalage: number) => {
  const d = new Date()
  d.setDate(d.getDate() + 21 + decalage)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Événement et page d'exemple propres à chaque modèle; aucun nom ou visuel d'artiste n'est présenté comme réel. */
export function evenementExemple(modele: CleModele = 'SOIREE'): Evenement {
  const exemple = EXEMPLES[modele]
  const debut = new Date()
  debut.setDate(debut.getDate() + 21)
  debut.setHours(18, 0, 0, 0)
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:00:00`
  const fin = new Date(debut)
  fin.setDate(fin.getDate() + (exemple.secondJour ? 1 : 0))
  fin.setHours(23, 0, 0, 0)
  return {
    id: 0,
    titre: exemple.titre,
    description: exemple.description,
    dateDebut: iso(debut),
    dateFin: iso(fin),
    lieu: exemple.lieu,
    prix: exemple.prix,
    devise: 'XOF',
    capacite: 400,
    placesReservees: 120,
    placesRestantes: 280,
    statut: 'PUBLIE',
    aImage: false,
    type: 'EVENEMENT',
    modele,
    ambiance: exemple.ambiance,
  }
}

export function pageExemple(modele: CleModele = 'SOIREE'): PageConfig {
  const exemple = EXEMPLES[modele]
  return {
    version: 1,
    sections: [
      { id: 'hero', type: 'HERO', actif: true, titre: exemple.titre, sousTitre: exemple.sousTitre, bouton: 'Réserver ma place' },
      {
        id: 'apropos',
        type: 'A_PROPOS',
        actif: true,
        titre: exemple.accroche,
        texte: exemple.description,
        bouton: 'Je réserve',
      },
      {
        id: 'interv',
        type: 'INTERVENANTS',
        actif: true,
        titre: modele === 'RENCONTRE' ? 'Activités & équipe' : modele === 'ATELIER' ? 'Équipe de la sortie' : 'Line-up & invités',
        intervenants: exemple.intervenants,
      },
      {
        id: 'prog',
        type: 'PROGRAMME',
        actif: true,
        titre: modele === 'RENCONTRE' || modele === 'ATELIER' ? 'Programme de la journée' : 'Programme',
        creneaux: exemple.creneaux.map((creneau) => ({ ...creneau, jour: jour(0) })),
      },
      { id: 'lieu', type: 'LIEU', actif: true, titre: 'Le point de rendez-vous', adresse: exemple.lieu, telephone: '', email: '' },
    ],
  }
}
