import type { Evenement } from '../../../core/api/types'
import type { PageConfig } from './types'

/** Événement et contenu d'exemple, pour montrer chaque modèle à l'administrateur avant qu'il ne choisisse. */
export function evenementExemple(): Evenement {
  const debut = new Date()
  debut.setDate(debut.getDate() + 21)
  debut.setHours(18, 0, 0, 0)
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:00:00`
  const fin = new Date(debut)
  fin.setDate(fin.getDate() + 1)
  fin.setHours(23, 0, 0, 0)
  return {
    id: 0,
    titre: 'Nuit de la rentrée IPNET',
    description: "Une soirée pour célébrer la rentrée : concerts d'artistes de l'institut, DJ sets, concours de danse et animations tout au long de la nuit. Venez avec vos amis, la scène est à vous.",
    dateDebut: iso(debut),
    dateFin: iso(fin),
    lieu: 'Campus IPNET, Lomé',
    prix: 2000,
    devise: 'XOF',
    capacite: 400,
    placesReservees: 120,
    placesRestantes: 280,
    statut: 'PUBLIE',
    aImage: false,
    type: 'EVENEMENT',
  }
}

export function pageExemple(): PageConfig {
  const jour = (decalage: number) => {
    const d = new Date()
    d.setDate(d.getDate() + 21 + decalage)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  return {
    version: 1,
    sections: [
      { id: 'hero', type: 'HERO', actif: true, titre: 'Nuit de la rentrée IPNET', sousTitre: 'Deux jours de musique, de danse et de rencontres', bouton: 'Réserver ma place' },
      {
        id: 'apropos',
        type: 'A_PROPOS',
        actif: true,
        titre: 'Une rentrée qui a de la voix',
        texte:
          "Pour la rentrée, l'institut ouvre ses portes à toutes les filières : concerts d'artistes de l'institut, DJ sets, concours de danse et animations jusqu'au bout de la nuit. Une occasion de retrouver les anciens, d'accueillir les nouveaux et de passer un moment ensemble sur le campus.",
        bouton: 'Je réserve',
      },
      {
        id: 'interv',
        type: 'INTERVENANTS',
        actif: true,
        titre: 'Sur scène',
        intervenants: [
          { nom: 'Kossi Amegah', role: 'DJ résident' },
          { nom: 'Ama Dossou', role: 'Chanteuse' },
          { nom: 'Yao Mensah', role: 'Groupe Savane' },
          { nom: 'Afi Kpodar', role: 'Danse contemporaine' },
        ],
      },
      {
        id: 'prog',
        type: 'PROGRAMME',
        actif: true,
        titre: 'Programme',
        creneaux: [
          { jour: jour(0), debut: '18:00', fin: '19:00', titre: 'Ouverture des portes', description: 'Accueil et cocktail de bienvenue', lieu: 'Cour centrale' },
          { jour: jour(0), debut: '19:00', fin: '21:00', titre: 'Concert Groupe Savane', intervenant: 'Yao Mensah', lieu: 'Scène principale' },
          { jour: jour(0), debut: '21:00', fin: '23:30', titre: 'DJ set', intervenant: 'Kossi Amegah', lieu: 'Scène principale' },
          { jour: jour(1), debut: '16:00', fin: '18:00', titre: 'Concours de danse', intervenant: 'Afi Kpodar', lieu: 'Salle polyvalente' },
          { jour: jour(1), debut: '20:00', fin: '22:30', titre: 'Grand concert de clôture', intervenant: 'Ama Dossou', lieu: 'Scène principale' },
        ],
      },
      { id: 'lieu', type: 'LIEU', actif: true, titre: 'Où nous trouver', adresse: 'Campus IPNET, Lomé, Togo', telephone: '+228 90 00 00 00', email: 'evenements@ipnet.tg' },
    ],
  }
}
