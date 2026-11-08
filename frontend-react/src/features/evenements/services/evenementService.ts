import { httpClient } from '../../../core/api/httpClient';
import { EvenementResume } from '../types/evenement.types';

export const evenementService = {
  lister: () => httpClient<{ elements: EvenementResume[] }>('/evenements'),
  consulter: (id: number | string) => httpClient<EvenementResume>(`/evenements/${id}`)
};
