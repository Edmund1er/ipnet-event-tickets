import { http } from '../../../core/api/httpClient'
import type { PageResponse } from '../../../core/api/types'
import type { StatutPaiement } from '../../../core/constants/statuts'

export interface PaiementAdmin {
  id: number
  inscriptionId: number
  referenceOperateur: string | null
  montant: number
  devise: string
  aCapture: boolean
  statut: StatutPaiement
  valideLe: string | null
  valideAutomatiquement: boolean
  motifRejet: string | null
  evenementId: number
  evenementTitre: string
  participantId: number
  participantNom: string
  participantPrenom: string
  participantEmail: string
}

export interface RapportRapprochement {
  lignesImportees: number
  confirmeesAutomatiquement: number
  aTraiterManuellement: number
}

export const adminPaiementService = {
  async lister(statut: StatutPaiement, page: number) {
    return (await http.get<PageResponse<PaiementAdmin>>('/admin/paiements', { params: { statut, page, size: 20, sort: 'id,asc' } })).data
  },
  async valider(id: number) {
    await http.post(`/admin/paiements/${id}/validation`)
  },
  async rejeter(id: number, motif: string) {
    await http.post(`/admin/paiements/${id}/rejet`, { motif })
  },
  async marquerRembourse(id: number) {
    await http.post(`/admin/paiements/${id}/remboursement`)
  },
  async capture(id: number) {
    const r = await http.get<Blob>(`/admin/paiements/${id}/preuve`, { responseType: 'blob' })
    return { url: URL.createObjectURL(r.data), type: r.data.type }
  },
  async importerReleve(fichier: File) {
    const fd = new FormData()
    fd.append('fichier', fichier)
    return (await http.post<RapportRapprochement>('/admin/paiements/releve', fd)).data
  },
}
