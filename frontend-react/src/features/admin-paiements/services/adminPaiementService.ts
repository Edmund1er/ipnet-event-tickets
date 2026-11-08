import { httpClient } from '../../../core/api/httpClient';
import { PaiementPreuve } from '../types/adminPaiement.types';

export const adminPaiementService = {
  lister: () => httpClient<{ content: PaiementPreuve[] }>('/admin/paiements'),
  valider: (id: number) => httpClient<void>(`/admin/paiements/${id}/validation`, { method: 'POST' }),
  rejeter: (id: number, motif: string) => httpClient<void>(`/admin/paiements/${id}/rejet`, { method: 'POST', body: JSON.stringify({ motif }) }),
  importerReleve: (formData: FormData) => httpClient<any>('/admin/paiements/releve', { method: 'POST', body: formData })
};
