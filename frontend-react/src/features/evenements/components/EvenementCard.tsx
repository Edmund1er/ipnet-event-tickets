import React from 'react';
import { EvenementResume } from '../types/evenement.types';
import { formatPrix, formatDateHeure } from '../../../core/utils/formatters';
import { Badge } from '../../../core/components/ui/Badge';

export const EvenementCard: React.FC<{ evenement: EvenementResume; onReserver?: () => void }> = ({ evenement, onReserver }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-lg text-white">{evenement.titre}</h3>
        <Badge label={evenement.statut} variant={evenement.statut === 'PUBLIE' ? 'success' : 'info'} />
      </div>
      <p className="text-sm text-slate-400 mt-2 line-clamp-2">{evenement.description}</p>
      <div className="mt-4 flex justify-between items-center text-sm">
        <span className="text-emerald-400 font-semibold">{formatPrix(evenement.prix, evenement.devise)}</span>
        <span className="text-slate-400 text-xs">{formatDateHeure(evenement.dateDebut)}</span>
      </div>
      {onReserver && (
        <button onClick={onReserver} className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition">
          Réserver
        </button>
      )}
    </div>
  );
};
