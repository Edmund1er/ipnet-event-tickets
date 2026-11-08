import React from 'react';

export interface MenuItem {
  libelle: string;
  route: string;
  roles: string[];
}

interface SidebarProps {
  items: MenuItem[];
  userRole?: string;
  currentPath: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ items, userRole, currentPath }) => {
  const filtered = items.filter(i => !userRole || i.roles.includes(userRole));

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 min-h-screen text-slate-300 p-4">
      <nav className="space-y-1">
        {filtered.map(item => (
          <a
            key={item.route}
            href={item.route}
            className={`block px-3 py-2 rounded-md text-sm font-medium transition ${
              currentPath === item.route
                ? 'bg-emerald-600 text-white'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            {item.libelle}
          </a>
        ))}
      </nav>
    </aside>
  );
};
