import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../../../core/components/ui/Button';

export const LoginForm: React.FC = () => {
  const { seConnecter, loading, error } = useAuth();
  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await seConnecter(telephone, motDePasse).catch(() => {});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto p-6 bg-slate-900 rounded-xl border border-slate-800">
      <h2 className="text-lg font-bold text-white">Connexion</h2>
      {error && <div className="text-xs text-rose-400 bg-rose-950 p-2 rounded">{error}</div>}
      <div>
        <label className="block text-xs font-medium text-slate-300">Numéro de téléphone</label>
        <input
          type="text"
          value={telephone}
          onChange={e => setTelephone(e.target.value)}
          placeholder="+22890000000"
          className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-300">Mot de passe</label>
        <input
          type="password"
          value={motDePasse}
          onChange={e => setMotDePasse(e.target.value)}
          className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white"
          required
        />
      </div>
      <Button type="submit" isLoading={loading} className="w-full">Se connecter</Button>
    </form>
  );
};
