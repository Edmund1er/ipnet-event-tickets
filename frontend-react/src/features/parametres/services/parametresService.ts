import { http } from '../../../core/api/httpClient'

export type CodeCanalPaiement = 'MOOV' | 'MIXX' | 'AUTRE'

export interface CanalPaiement {
  code: CodeCanalPaiement
  libelle: string
  numeroMobileMoney: string
  numeroAffiche: string
  titulaire: string | null
  modifieLe: string
}

export interface ParametresPaiement {
  configure: boolean
  numeroMobileMoney: string | null
  numeroAffiche: string | null
  operateur: string | null
  titulaire: string | null
  modifieLe: string | null
  canaux: CanalPaiement[]
}

export interface ParametresAdmin {
  paiement: ParametresPaiement
  smtp: { configure: boolean; hote: string | null; port: number | null; expediteur: string | null }
}

export interface AnalyseNumero {
  e164: string
  international: string
  pays: string
  type: string
  operateur: string | null
}

export const parametresService = {
  async lire() {
    return (await http.get<ParametresAdmin>('/admin/parametres')).data
  },
  async analyser(numero: string) {
    return (await http.get<AnalyseNumero>('/admin/parametres/analyse-numero', { params: { numero } })).data
  },
  async enregistrerPaiement(numero: string, titulaire: string, operateur: string) {
    return (await http.put<ParametresPaiement>('/admin/parametres/paiement', { numero, titulaire, operateur: operateur || null })).data
  },
  async enregistrerCanaux(canaux: { code: 'MOOV' | 'MIXX'; numero: string | null; titulaire: string | null }[]) {
    return (await http.put<ParametresPaiement>('/admin/parametres/paiement/canaux', { canaux })).data
  },
  async testerEmail() {
    return (await http.post<{ message: string }>('/admin/parametres/test-email')).data
  },
}
