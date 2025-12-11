import React, { useMemo } from 'react';
import { ALL_TOOLS } from '../constants';
import { ToolCategory } from '../types';
import { ScrollText, Home, Star, Clock } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const location = useLocation();
  const categories = Object.values(ToolCategory);

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ to, icon: Icon, label, active }: any) => (
    <Link
      to={to}
      onClick={onCloseMobile}
      className={clsx(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
        active 
          ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30" 
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
      )}
    >
      <Icon size={20} className={active ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-primary-600"} />
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={clsx(
          "fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onCloseMobile}
      />

      {/* Sidebar Content */}
      <aside 
        className={clsx(
          "fixed top-0 left-0 h-full w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <img src="/favicon.svg" alt="Logo" className="w-8 h-8" />
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">
            All PDF Tools
          </h1>
        </div>

        <div className="h-[calc(100vh-80px)] overflow-y-auto p-4 space-y-1">
          <NavItem to="/" icon={Home} label="All Tools" active={isActive('/')} />
          
          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Favorites
          </div>
          <NavItem to="/favorites" icon={Star} label="My Favorites" active={isActive('/favorites')} />
          <NavItem to="/history" icon={Clock} label="History" active={isActive('/history')} />

          <div className="pt-6 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Categories
          </div>
          {categories.map(cat => (
             <Link
             key={cat}
             to={`/category/${cat}`}
             onClick={onCloseMobile}
             className={clsx(
               "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm",
               location.pathname === `/category/${cat}`
                 ? "text-primary-600 bg-primary-50 dark:bg-primary-900/20 font-medium" 
                 : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
             )}
           >
             <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
             {cat}
           </Link>
          ))}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
