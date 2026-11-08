import React from 'react';

interface NavbarProps {
  nomUtilisateur?: string;
  onDeconnexion?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ nomUtilisateur, onDeconnexion }) => {
  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-xl tracking-tight text-emerald-400">IPNET Billetterie</span>
          <span className="text-xs bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">Campus Event</span>
        </div>
        <div className="flex items-center space-x-4">
          {nomUtilisateur ? (
            <>
              <span className="text-sm text-slate-300">Connecté en tant que <strong>{nomUtilisateur}</strong></span>
              <button
                onClick={onDeconnexion}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded transition"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <a href="/connexion" className="text-sm text-emerald-400 hover:text-emerald-300">Se connecter</a>
          )}
        </div>
      </div>
    </header>
  );
};
