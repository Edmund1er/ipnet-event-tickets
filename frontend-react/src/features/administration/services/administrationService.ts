import { http } from '../../../core/api/httpClient'
import type { Evenement, PageResponse } from '../../../core/api/types'
import type { StatutOutbox } from '../../../core/constants/statuts'

export interface TableauDeBord {
  evenementsPublies: number
  evenementsBrouillons: number
  reservationsEnAttentePaiement: number
  reservationsConfirmees: number
  paiementsATraiter: number
  paiementsARembourser: number
  billetsValides: number
  billetsScannes: number
  notificationsEnEchec: number
  paiementConfigure: boolean
  smtpConfigure: boolean
}

export interface AgentScan {
  id: number
  email: string
  emailVerifie: boolean
  telephone: string
  actif: boolean
  creeLe: string
}

export interface EntreeAudit {
  id: number
  acteurId: number | null
  acteurEmail: string | null
  action: string
  typeCible: string
  idCible: string
  details: string | null
  horodatage: string
}

export interface Notification {
  id: number
  canal: string
  destinataire: string
  modele: string
  statut: StatutOutbox
  tentatives: number
  derniereErreur: string | null
  creeLe: string
}

export const administrationService = {
  async tableauDeBord() {
    return (await http.get<TableauDeBord>('/admin/tableau-de-bord')).data
  },
  async prochainsEvenements() {
    return (await http.get<PageResponse<Evenement>>('/admin/evenements', { params: { statut: 'PUBLIE', size: 5, sort: 'dateDebut,asc' } })).data
  },
  async agents() {
    return (await http.get<AgentScan[]>('/admin/scanners')).data
  },
  async creerAgent(email: string, telephone: string, motDePasse: string) {
    return (await http.post<AgentScan>('/admin/scanners', { email, telephone, motDePasse })).data
  },
  async desactiverAgent(id: number) {
    await http.patch(`/admin/scanners/${id}/desactivation`)
  },
  async audit(page: number) {
    return (await http.get<PageResponse<EntreeAudit>>('/admin/audit', { params: { page, size: 25, sort: 'horodatage,desc' } })).data
  },
  async notifications(statut: StatutOutbox | '', page: number) {
    const params: Record<string, string | number> = { page, size: 25, sort: 'creeLe,desc' }
    if (statut) params.statut = statut
    return (await http.get<PageResponse<Notification>>('/admin/notifications', { params })).data
  },
  async relancer(id: number) {
    await http.post(`/admin/notifications/${id}/relance`)
  },
}
