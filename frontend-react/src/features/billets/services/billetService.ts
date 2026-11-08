import { httpClient } from '../../../core/api/httpClient';
import { Billet } from '../types/billet.types';

export const billetService = {
  mesBillets: () => httpClient<Billet[]>('/billets/moi'),
  getQrUrl: (id: string) => `/api/billets/${id}/qr`
};
