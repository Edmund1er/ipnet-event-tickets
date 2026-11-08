import { httpClient } from '../../../core/api/httpClient';
import { Reservation } from '../types/reservation.types';

export const reservationService = {
  reserver: (evenementId: number) => httpClient<Reservation>('/reservations', { method: 'POST', body: JSON.stringify({ evenementId }) }),
  mesReservations: () => httpClient<{ elements: Reservation[] }>('/reservations/moi'),
  annuler: (id: number) => httpClient<void>(`/reservations/${id}`, { method: 'DELETE' }),
  soumettrePreuve: (id: number, formData: FormData) => httpClient<any>(`/reservations/${id}/preuve`, { method: 'POST', body: formData })
};
