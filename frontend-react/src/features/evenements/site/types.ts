/** Types de page, un par modèle de template. Le choix de l'admin est conservé dans `evenement.modele`. */
export type CleModele = 'SOIREE' | 'CONFERENCE' | 'RENCONTRE' | 'CEREMONIE' | 'ATELIER' | 'TOURNOI' | 'SALON' | 'RESEAUTAGE'

export interface DescriptionModele {
  cle: CleModele
  /** Description du type d'événement, pas un nom de modèle technique. */
  nom: string
  pourQui: string
  /** Dossier des fichiers du template (public/modeles/<dossier>). */
  dossier: string
}

export const MODELES: DescriptionModele[] = [
  { cle: 'SOIREE', nom: 'Soirée, concert et événement nocturne', pourQui: 'Mise en scène immersive, grand titre et visuels expressifs.', dossier: 'soiree' },
  { cle: 'CONFERENCE', nom: 'Conférence, séminaire et journée scientifique', pourQui: 'Présentation structurée des orateurs et du programme par jour.', dossier: 'conference' },
  { cle: 'RENCONTRE', nom: 'Forum, hackathon et rencontre étudiante', pourQui: 'Présentation dynamique avec compte à rebours et programme quotidien.', dossier: 'rencontre' },
  { cle: 'CEREMONIE', nom: 'Cérémonie, gala et portes ouvertes', pourQui: 'Présentation élégante avec programme par jour et offres de billets.', dossier: 'ceremonie' },
  { cle: 'ATELIER', nom: 'Atelier, formation et masterclass', pourQui: 'Mise en avant des apprentissages, intervenants et ateliers pratiques.', dossier: 'atelier' },
  { cle: 'TOURNOI', nom: 'Tournoi, compétition et e-sport', pourQui: 'Affichage dynamique des journées, matchs et informations de compétition.', dossier: 'tournoi' },
  { cle: 'SALON', nom: 'Salon, exposition et foire', pourQui: 'Présentation visuelle des exposants, stands et temps forts.', dossier: 'salon' },
  { cle: 'RESEAUTAGE', nom: 'Lancement, networking et rencontre professionnelle', pourQui: 'Page orientée rencontres, invités et échanges professionnels.', dossier: 'reseautage' },
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
