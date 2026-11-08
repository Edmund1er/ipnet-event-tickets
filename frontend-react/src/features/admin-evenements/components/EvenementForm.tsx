import React, { useState } from 'react';
import { Button } from '../../../core/components/ui/Button';
import { CreerEvenementDemande } from '../types/adminEvenement.types';

export const EvenementForm: React.FC<{ onSubmit: (data: CreerEvenementDemande) => Promise<any> }> = ({ onSubmit }) => {
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [lieu, setLieu] = useState('');
  const [prix, setPrix] = useState(0);
  const [capacite, setCapacite] = useState(100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ titre, description, dateDebut, lieu, prix, devise: 'XOF', capacite });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900 p-6 rounded-xl border border-slate-800">
      <h3 className="text-lg font-bold text-white">Créer un Événement</h3>
      <input type="text" placeholder="Titre" value={titre} onChange={e => setTitre(e.target.value)} required className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" />
      <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} required className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" />
      <input type="datetime-local" value={dateDebut} onChange={e => setDateDebut(e.target.value)} required className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" />
      <input type="text" placeholder="Lieu" value={lieu} onChange={e => setLieu(e.target.value)} required className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" />
      <div className="grid grid-cols-2 gap-4">
        <input type="number" placeholder="Prix" value={prix} onChange={e => setPrix(+e.target.value)} className="px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" />
        <input type="number" placeholder="Capacité" value={capacite} onChange={e => setCapacite(+e.target.value)} className="px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" />
      </div>
      <Button type="submit">Créer l'événement</Button>
    </form>
  );
};
