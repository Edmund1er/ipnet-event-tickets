import { httpClient } from '../../../core/api/httpClient';
import { CreerEvenementDemande } from '../types/adminEvenement.types';

export const adminEvenementService = {
  creer: (data: CreerEvenementDemande) => httpClient<any>('/admin/evenements', { method: 'POST', body: JSON.stringify(data) }),
  modifier: (id: number, data: CreerEvenementDemande) => httpClient<any>(`/admin/evenements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  publier: (id: number) => httpClient<void>(`/admin/evenements/${id}/publication`, { method: 'POST' }),
  annuler: (id: number, motif: string) => httpClient<void>(`/admin/evenements/${id}/annulation`, { method: 'POST', body: JSON.stringify({ motif }) })
};
