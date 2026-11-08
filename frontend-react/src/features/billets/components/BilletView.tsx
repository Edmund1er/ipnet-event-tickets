import React from 'react';
import { Billet } from '../types/billet.types';
import { billetService } from '../services/billetService';
import { Badge } from '../../../core/components/ui/Badge';

export const BilletView: React.FC<{ billet: Billet }> = ({ billet }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center max-w-sm mx-auto shadow-lg">
      <h3 className="text-base font-bold text-white">Billet Officiel</h3>
      <div className="my-4 flex justify-center">
        <img src={billetService.getQrUrl(billet.id)} alt="QR Code" className="w-48 h-48 bg-white p-2 rounded-lg" />
      </div>
      <div className="text-xs text-slate-400 font-mono">ID: {billet.id}</div>
      <div className="mt-3">
        {billet.invalide ? <Badge label="ANNULÉ" variant="error" /> : billet.scanneLe ? <Badge label="UTILISÉ" variant="info" /> : <Badge label="VALIDE" variant="success" />}
      </div>
    </div>
  );
};
