import { useState, useEffect } from 'react';
import { reservationService } from '../services/reservationService';
import { Reservation } from '../types/reservation.types';

export function useReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const charger = () => {
    setLoading(true);
    reservationService.mesReservations()
      .then(res => setReservations(res.elements || []))
      .catch(() => setReservations([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { charger(); }, []);

  return { reservations, loading, recharger: charger };
}
