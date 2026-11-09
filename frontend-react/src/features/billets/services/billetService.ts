import { http } from '../../../core/api/httpClient'

export interface Billet {
  id: string
  inscriptionId: number
  evenementId: number
  evenementTitre: string
  evenementDate: string
  evenementLieu: string | null
  porteurNom: string
  porteurPrenom: string
  scanneLe: string | null
  invalide: boolean
}

export const billetService = {
  async mesBillets() {
    return (await http.get<Billet[]>('/billets/moi')).data
  },
  cheminQr: (id: string) => `/billets/${id}/qr`,
  async renvoyer(id: string) {
    return (await http.post<{ message: string }>(`/billets/${id}/renvoi`)).data
  },
}
