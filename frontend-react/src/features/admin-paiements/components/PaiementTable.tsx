import React from 'react';
import { PaiementPreuve } from '../types/adminPaiement.types';
import { formatPrix } from '../../../core/utils/formatters';

export const PaiementTable: React.FC<{
  paiements: PaiementPreuve[];
  onValider: (id: number) => void;
  onRejeter: (id: number) => void;
}> = ({ paiements, onValider, onRejeter }) => {
  return (
    <div className="overflow-x-auto bg-slate-900 rounded-xl border border-slate-800">
      <table className="w-full text-sm text-left text-slate-300">
        <thead className="bg-slate-800 text-xs text-slate-400 uppercase">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Référence</th>
            <th className="px-4 py-3">Montant</th>
            <th className="px-4 py-3">Statut</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {paiements.map(p => (
            <tr key={p.id}>
              <td className="px-4 py-3">#{p.id}</td>
              <td className="px-4 py-3 font-mono font-medium text-white">{p.referenceOperateur}</td>
              <td className="px-4 py-3 text-emerald-400">{formatPrix(p.montant, p.devise)}</td>
              <td className="px-4 py-3">{p.statut}</td>
              <td className="px-4 py-3 space-x-2">
                <button onClick={() => onValider(p.id)} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded">Valider</button>
                <button onClick={() => onRejeter(p.id)} className="text-xs bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded">Rejeter</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
