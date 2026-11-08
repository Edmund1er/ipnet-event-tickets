import React from 'react';
import { Reservation } from '../types/reservation.types';
import { Badge } from '../../../core/components/ui/Badge';

export const ReservationList: React.FC<{ reservations: Reservation[]; onAnnuler?: (id: number) => void }> = ({ reservations, onAnnuler }) => {
  return (
    <div className="space-y-3">
      {reservations.map(r => (
        <div key={r.id} className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex justify-between items-center">
          <div>
            <div className="text-sm font-semibold text-white">Réservation #{r.id}</div>
            <div className="text-xs text-slate-400">Événement: {r.evenementId}</div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge label={r.statut} variant={r.statut === 'CONFIRMEE' ? 'success' : r.statut === 'EN_ATTENTE_PAIEMENT' ? 'warning' : 'info'} />
            {onAnnuler && r.statut === 'EN_ATTENTE_PAIEMENT' && (
              <button onClick={() => onAnnuler(r.id)} className="text-xs text-rose-400 hover:text-rose-300">Annuler</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
