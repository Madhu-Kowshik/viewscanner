import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, Eye, FilePlus2, Split, Scissors } from 'lucide-react';

export const MobileTabBar: React.FC = () => {
  const tabs = [
    { label: 'Organize', path: '/organize', icon: LayoutGrid },
    { label: 'Viewer', path: '/viewer', icon: Eye },
    { label: 'Merge', path: '/merge', icon: FilePlus2 },
    { label: 'Split', path: '/split', icon: Split },
    { label: 'Extract', path: '/extract', icon: Scissors },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 border-t border-slate-200 dark:border-slate-800 backdrop-blur-md safe-area-pb">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-400 font-semibold'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`
              }
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
