/** Types de page, un par modèle de template. Le choix de l'admin est conservé dans `evenement.modele`. */
export type CleModele = 'SOIREE' | 'CONFERENCE' | 'RENCONTRE' | 'CEREMONIE'

export interface DescriptionModele {
  cle: CleModele
  nom: string
  pourQui: string
  /** Dossier des fichiers du template (public/modeles/<dossier>). */
  dossier: string
}

export const MODELES: DescriptionModele[] = [
  { cle: 'SOIREE', nom: 'Soirée / Concert', pourQui: 'Fêtes, soirées dansantes, concerts, événements nocturnes du campus. Fond noir, titre géant, ambiance de scène.', dossier: 'soiree' },
  { cle: 'CONFERENCE', nom: 'Conférence', pourQui: 'Conférences, séminaires, journées scientifiques. Page sombre et sobre avec orateurs et programme par jour.', dossier: 'conference' },
  { cle: 'RENCONTRE', nom: 'Rencontre / Forum', pourQui: 'Forums, hackathons, rencontres étudiantes, semaines thématiques. Dégradé coloré, compte à rebours, programme par jour.', dossier: 'rencontre' },
  { cle: 'CEREMONIE', nom: 'Cérémonie / Gala', pourQui: 'Cérémonies, remises de diplômes, galas, portes ouvertes. Page claire et formelle avec onglets de jours et pass.', dossier: 'ceremonie' },
]

export const modeleDe = (cle?: string | null) => MODELES.find((m) => m.cle === cle) ?? null

/* ---- Contenu saisi par l'administrateur (miroir de PageEvenement côté serveur) ---- */

export type TypeSection = 'HERO' | 'A_PROPOS' | 'INTERVENANTS' | 'PROGRAMME' | 'LIEU' | 'TEXTE'

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
}

export interface PageConfig {
  version: number
  sections: SectionConfig[]
}

export const PAGE_VIDE: PageConfig = { version: 1, sections: [] }

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
