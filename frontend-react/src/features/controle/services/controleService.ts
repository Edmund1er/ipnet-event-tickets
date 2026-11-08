import { httpClient } from '../../../core/api/httpClient';
import { ScanResultat, StatistiquesScan } from '../types/controle.types';

export const controleService = {
  scanner: (jetonQr: string, evenementId: number) => httpClient<ScanResultat>('/scan', { method: 'POST', body: JSON.stringify({ jetonQr, evenementId }) }),
  getStatistiques: (evenementId: number) => httpClient<StatistiquesScan>(`/scan/evenements/${evenementId}/statistiques`)
};
