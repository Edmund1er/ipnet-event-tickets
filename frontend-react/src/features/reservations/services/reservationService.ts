import { http } from '../../../core/api/httpClient'
import type { Evenement, PageResponse } from '../../../core/api/types'
import type { StatutInscription } from '../../../core/constants/statuts'

export interface Reservation {
  id: number
  statut: StatutInscription
  creeLe: string
  expireLe: string | null
  motif: string | null
  montant: number
  devise: string
  evenement: Evenement
}

export interface ParametresPaiement {
  configure: boolean
  numeroMobileMoney: string | null
  numeroAffiche: string | null
  operateur: string | null
  titulaire: string | null
}

export const reservationService = {
  async mesReservations(page = 0) {
    return (await http.get<PageResponse<Reservation>>('/reservations/moi', { params: { page, size: 20, sort: 'creeLe,desc' } })).data
  },
  async uneReservation(id: number) {
    const r = await http.get<PageResponse<Reservation>>('/reservations/moi', { params: { size: 200 } })
    const trouvee = r.data.elements.find((x) => x.id === id)
    if (!trouvee) throw new Error('Réservation introuvable')
    return trouvee
  },
  async annuler(id: number) {
    await http.delete(`/reservations/${id}`)
  },
  async parametresPaiement() {
    return (await http.get<ParametresPaiement>('/parametres/paiement')).data
  },
  async soumettreReference(id: number, reference: string, capture: File | null) {
    const fd = new FormData()
    fd.append('referenceOperateur', reference)
    if (capture) fd.append('fichier', capture)
    return (await http.post<{ message: string }>(`/reservations/${id}/preuve`, fd)).data
  },
}
