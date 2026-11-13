import { http, telecharger } from '../../../core/api/httpClient'
import type { Evenement, PageResponse } from '../../../core/api/types'
import type { ResultatScan } from '../../../core/constants/statuts'

export interface ReponseScan {
  resultat: ResultatScan
  nom: string | null
  prenom: string | null
  detail: string | null
  instant: string | null
  premierScan: string | null
}

export interface PersonneEntree {
  nom: string
  prenom: string
  detail: string
  entreeLe: string
}

export interface Statistiques {
  evenementId: number
  nombreEntrees: number
  nombreBilletsConfirmes: number
  nombreRestants: number
  personnes: PersonneEntree[]
}

export const controleService = {
  /** Événements ouverts au contrôle (publiés). */
  async evenements() {
    return (await http.get<PageResponse<Evenement>>('/evenements', { params: { size: 100, sort: 'dateDebut,asc', activites: true } })).data.elements.filter((e) => e.type !== 'CADRE')
  },
  async scanner(jeton: string, evenementId: number) {
    return (await http.post<ReponseScan>('/scan', { jeton, evenementId })).data
  },
  async statistiques(evenementId: number) {
    return (await http.get<Statistiques>(`/scan/evenements/${evenementId}/statistiques`)).data
  },
  async exporter(evenementId: number, format: 'CSV' | 'PDF') {
    await telecharger(`/admin/evenements/${evenementId}/export`, `presences_evt_${evenementId}.${format.toLowerCase()}`, { format })
  },
}
