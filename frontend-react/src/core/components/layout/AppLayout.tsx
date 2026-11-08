import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar, MenuItem } from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
  menuItems: MenuItem[];
  userRole?: string;
  nomUtilisateur?: string;
  currentPath: string;
  onDeconnexion?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  menuItems,
  userRole,
  nomUtilisateur,
  currentPath,
  onDeconnexion
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar nomUtilisateur={nomUtilisateur} onDeconnexion={onDeconnexion} />
      <div className="flex flex-1">
        <Sidebar items={menuItems} userRole={userRole} currentPath={currentPath} />
        <main className="flex-1 p-6 max-w-6xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
