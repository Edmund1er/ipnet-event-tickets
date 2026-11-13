import { http, telecharger } from '../../../core/api/httpClient'
import type { Evenement, PageResponse, TypeProfil } from '../../../core/api/types'
import type { StatutEvenement, StatutInscription } from '../../../core/constants/statuts'

export interface DonneesEvenement {
  titre: string
  description: string
  dateDebut: string
  lieu: string
  prix: number
  devise: string
  capacite: number
  dateLimiteReservation?: string | null
  /** Programme multi-jours : fin du programme. */
  dateFin?: string | null
  type?: 'EVENEMENT' | 'CADRE'
}

export interface DonneesActivite {
  type: 'ACTIVITE' | 'PASS'
  titre: string
  description: string
  categorie: string | null
  dateDebut: string
  dateFin: string
  lieu: string
  prix: number
  capacite: number | null
  accesLibre: boolean
  passPortee: 'GLOBAL' | 'JOURNEE' | null
  passJour: string | null
  ambiance: string | null
  couleurPrincipale: string | null
}

export interface Participant {
  inscriptionId: number
  utilisateurId: number
  nom: string
  prenom: string
  email: string
  telephone: string
  typeProfil: TypeProfil
  statut: StatutInscription
  reserveLe: string
}

export const adminEvenementService = {
  async lister(statut: StatutEvenement | '', titre: string, page: number) {
    const params: Record<string, string | number> = { page, size: 20, sort: 'dateDebut,desc' }
    if (statut) params.statut = statut
    if (titre.trim()) params.titre = titre.trim()
    return (await http.get<PageResponse<Evenement>>('/admin/evenements', { params })).data
  },
  async detail(id: number) {
    return (await http.get<Evenement>(`/admin/evenements/${id}`)).data
  },
  async creer(d: DonneesEvenement) {
    return (await http.post<Evenement>('/admin/evenements', d)).data
  },
  async modifier(id: number, d: DonneesEvenement) {
    return (await http.put<Evenement>(`/admin/evenements/${id}`, d)).data
  },
  /** Masque définitivement un événement passé (il quitte toutes les listes). */
  async masquer(id: number) {
    await http.post(`/admin/evenements/${id}/masquage`)
  },
  async activites(id: number) {
    return (await http.get<Evenement[]>(`/admin/evenements/${id}/activites`)).data
  },
  async creerActivite(cadreId: number, d: DonneesActivite) {
    return (await http.post<Evenement>(`/admin/evenements/${cadreId}/activites`, d)).data
  },
  async modifierActivite(id: number, d: DonneesActivite) {
    return (await http.put<Evenement>(`/admin/evenements/${id}/activite`, d)).data
  },
  async supprimerActivite(id: number) {
    await http.delete(`/admin/evenements/${id}/activite`)
  },
  async dupliquerJour(cadreId: number, source: string, cibles: string[]) {
    return (await http.post<Evenement[]>(`/admin/evenements/${cadreId}/activites/duplication`, { source, cibles })).data
  },
  async definirApparence(id: number, ambiance: string | null, couleurPrincipale: string | null) {
    return (await http.put<Evenement>(`/admin/evenements/${id}/apparence`, { ambiance, couleurPrincipale })).data
  },
  async publier(id: number) {
    return (await http.post<Evenement>(`/admin/evenements/${id}/publication`)).data
  },
  async cloturer(id: number) {
    return (await http.post<Evenement>(`/admin/evenements/${id}/cloture`)).data
  },
  async fermerVentes(id: number) {
    return (await http.post<Evenement>(`/admin/evenements/${id}/ventes/fermeture`)).data
  },
  async rouvrirVentes(id: number) {
    return (await http.post<Evenement>(`/admin/evenements/${id}/ventes/reouverture`)).data
  },
  async annuler(id: number, motif: string) {
    return (await http.post<Evenement>(`/admin/evenements/${id}/annulation`, { motif })).data
  },
  async envoyerImage(id: number, fichier: File) {
    const fd = new FormData()
    fd.append('fichier', fichier)
    return (await http.post<Evenement>(`/admin/evenements/${id}/image`, fd)).data
  },
  async supprimerImage(id: number) {
    return (await http.delete<Evenement>(`/admin/evenements/${id}/image`)).data
  },
  cheminImage: (id: number) => `/admin/evenements/${id}/image`,
  async participants(id: number) {
    return (await http.get<Participant[]>(`/admin/evenements/${id}/participants`)).data
  },
  async exporter(id: number, format: 'CSV' | 'PDF') {
    await telecharger(`/admin/evenements/${id}/export`, `presences_evt_${id}.${format.toLowerCase()}`, { format })
  },
}
