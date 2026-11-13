import { http } from '../../../core/api/httpClient'
import type { Evenement, PageResponse } from '../../../core/api/types'

export interface FiltresEvenements {
  titre?: string
  dateMin?: string
  dateMax?: string
  /** Poste de contrôle : inclut les activités et pass des programmes. */
  activites?: boolean
  prixMin?: string
  prixMax?: string
  page?: number
}

export const evenementService = {
  /** Programme d'un événement-cadre : activités et pass publiés. */
  async activites(id: number) {
    return (await http.get<Evenement[]>(`/evenements/${id}/activites`)).data
  },
  async lister(f: FiltresEvenements) {
    const params: Record<string, string | number> = { page: f.page ?? 0, size: 12, sort: 'dateDebut,asc' }
    if (f.activites) params.activites = 'true'
    for (const cle of ['titre', 'dateMin', 'dateMax', 'prixMin', 'prixMax'] as const) {
      const v = f[cle]?.toString().trim()
      if (v) params[cle] = v
    }
    return (await http.get<PageResponse<Evenement>>('/evenements', { params })).data
  },
  async detail(id: number) {
    return (await http.get<Evenement>(`/evenements/${id}`)).data
  },
  /** Réservation existante du participant pour cet événement (RG-06 : une seule par événement). */
  async maReservation(evenementId: number) {
    const r = await http.get<PageResponse<{ id: number; statut: string; evenement: { id: number } }>>('/reservations/moi', {
      params: { size: 200 },
    })
    return r.data.elements.find((x) => x.evenement.id === evenementId) ?? null
  },
  async reserver(evenementId: number) {
    return (await http.post<{ id: number; statut: string }>('/reservations', { evenementId })).data
  },
}

export const urlImageEvenement = (id: number) => `/api/evenements/${id}/image`
