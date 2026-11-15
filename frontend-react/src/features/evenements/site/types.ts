/** Types de page, un par modèle de template. Le choix de l'admin est conservé dans `evenement.modele`. */
export type CleModele = 'SOIREE' | 'CONFERENCE' | 'RENCONTRE' | 'CEREMONIE' | 'ATELIER' | 'TOURNOI' | 'SALON' | 'RESEAUTAGE' | 'LAGON' | 'FORET' | 'FORUM'

export interface DescriptionModele {
  cle: CleModele
  /** Description du type d'événement, pas un nom de modèle technique. */
  nom: string
  pourQui: string
  /** Dossier des fichiers du template (public/modeles/<dossier>). */
  dossier: string
}

export const MODELES: DescriptionModele[] = [
  { cle: 'SOIREE', nom: 'Soirée étudiante, club et nuit dansante', pourQui: 'Ambiance nocturne, DJ, danse et réservation rapide.', dossier: 'soiree' },
  { cle: 'CONFERENCE', nom: 'Concert & showcase — scène live', pourQui: 'Line-up d’artistes, horaires de scène et billets de concert.', dossier: 'conference' },
  { cle: 'RENCONTRE', nom: 'Journée d’intégration & sortie de groupe', pourQui: 'Rencontre entre étudiants, activités en équipe et programme de la journée.', dossier: 'rencontre' },
  { cle: 'CEREMONIE', nom: 'Bal de promo, gala et remise des diplômes', pourQui: 'Grande soirée habillée, dîner, distinctions et danse.', dossier: 'ceremonie' },
  { cle: 'ATELIER', nom: 'Atelier créatif & festival jeunesse', pourQui: 'Animations, ateliers et programmation en plusieurs temps.', dossier: 'atelier' },
  { cle: 'TOURNOI', nom: 'Tournoi sportif et e-sport', pourQui: 'Matchs, équipes, journées de compétition et accès.', dossier: 'tournoi' },
  { cle: 'SALON', nom: 'Gospel, louange et concert', pourQui: 'Concert live, invités, programme et billetterie.', dossier: 'salon' },
  { cle: 'RESEAUTAGE', nom: 'Soirée DJ, club et nuit électro', pourQui: 'Line-up de DJs, ambiance nocturne et accès à la soirée.', dossier: 'reseautage' },
  { cle: 'LAGON', nom: 'Sortie à la plage — couleurs vives', pourQui: 'Journée plage, lagon, activités nautiques et programme ensoleillé.', dossier: 'lagon' },
  { cle: 'FORET', nom: 'Escapade nature & randonnée', pourQui: 'Visite nature, sentiers, verdure et moments en plein air.', dossier: 'foret' },
  { cle: 'FORUM', nom: 'Forum, conférence & séminaire', pourQui: 'Intervenants, sessions, programme sur plusieurs jours.', dossier: 'forum' },
]

export const modeleDe = (cle?: string | null) => MODELES.find((m) => m.cle === cle) ?? null

/* ---- Contenu saisi par l'administrateur (miroir de PageEvenement côté serveur) ---- */

export type TypeSection = 'HERO' | 'A_PROPOS' | 'INTERVENANTS' | 'PROGRAMME' | 'LIEU' | 'TEXTE' | 'CARTES' | 'COLONNES'

export interface BlocElementConfig {
  id: string
  titre: string
  texte?: string | null
  image?: string | null
}

export interface IntervenantConfig {
  nom: string
  role?: string | null
  photo?: string | null
}

export interface CreneauConfig {
  jour: string
  debut: string
  fin?: string | null
  titre: string
  description?: string | null
  intervenant?: string | null
  lieu?: string | null
}

export interface SectionConfig {
  id: string
  type: TypeSection
  actif: boolean
  titre?: string | null
  sousTitre?: string | null
  texte?: string | null
  image?: string | null
  bouton?: string | null
  adresse?: string | null
  telephone?: string | null
  email?: string | null
  intervenants?: IntervenantConfig[] | null
  creneaux?: CreneauConfig[] | null
  elements?: BlocElementConfig[] | null
  colonnes?: number | null
  couleurFond?: string | null
  couleurTexte?: string | null
  couleurAccent?: string | null
  couleurCarte?: string | null
  couleurBouton?: string | null
}

export interface ApparencePage {
  couleurPrincipale?: string | null
  couleurSecondaire?: string | null
  couleurBloc?: string | null
  opaciteBloc?: number | null
  couleurEntete?: string | null
  couleurTexteEntete?: string | null
  couleurFondPage?: string | null
  couleurPied?: string | null
  couleurTextePied?: string | null
  couleurTexte?: string | null
  couleurCarte?: string | null
  couleurBouton?: string | null
}

export interface StyleSectionPage {
  id: string
  couleurFond?: string
  couleurTexte?: string
  couleurAccent?: string
  couleurCarte?: string
  couleurBouton?: string
}

export interface BlocPage {
  id: string
  type: 'CARTES' | 'COLONNES'
  titre: string
  sousTitre?: string
  colonnes: number
  elements: { id: string; titre: string; texte?: string; image?: string }[]
  style: StyleSectionPage
}

export interface PageConfig {
  version: number
  apparence?: ApparencePage | null
  sections: SectionConfig[]
}

export const PAGE_VIDE: PageConfig = { version: 1, apparence: null, sections: [] }

/* ---- Contenu résolu : ce que les templates affichent, qu'il vienne de la page ou de l'événement ---- */

export interface Ligne {
  debut: string
  fin?: string
  titre: string
  description?: string
  intervenant?: string
  lieu?: string
  /** Activité du programme : un clic ouvre sa propre page. */
  lienId?: number
  tarif?: string
}

export interface Jour {
  cle: string
  /** « Lundi 3 juin » */
  etiquette: string
  /** « 3 juin 2026 » */
  dateLongue: string
  lignes: Ligne[]
}

export interface Offre {
  nom: string
  prix: string
  points: string[]
  /** Pass : ouvre sa page. Sans identifiant : réserve l'événement affiché. */
  lienId?: number
}

export interface ContenuPage {
  titre: string
  couleurPrincipale?: string
  couleurSecondaire?: string
  couleurBloc?: string
  opaciteBloc: number
  apparencePage: ApparencePage
  stylesSections: StyleSectionPage[]
  blocs: BlocPage[]
  accroche?: string
  dateTexte: string
  /** Date de début en millisecondes, pour les comptes à rebours. */
  debutMs: number
  lieu?: string
  imageHero?: string
  boutonHero: string
  apropos?: { titre: string; texte: string; image?: string; bouton: string }
  intervenants?: { titre: string; sousTitre?: string; liste: { nom: string; role: string; photo: string }[] }
  programme?: { titre: string; sousTitre?: string; jours: Jour[] }
  lieuInfos?: { titre: string; adresse: string; texte?: string; telephone?: string; email?: string; image?: string }
  textes: { id: string; titre: string; texte: string; image?: string }[]
  offres: Offre[]
  boutonReserver: string
  /** Menu du site : uniquement les sections présentes. */
  menu: { libelle: string; ancre: string }[]
  /** Détail utile à l'en-tête et au pied de page. */
  nomSite: string
}
