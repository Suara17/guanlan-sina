
import React from 'react';
import { NavItem } from '../types';
import { LayoutDashboard, Cable, Store, Cuboid, Settings, Activity, Sparkles } from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpen: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: '生产可视化', icon: LayoutDashboard, path: '/' },
  { id: 'sinan', label: '司南智控', icon: Sparkles, path: '/sinan' },
  { id: 'kernel', label: 'OS 内核接入', icon: Cable, path: '/kernel' },
  { id: 'marketplace', label: '能力商店', icon: Store, path: '/marketplace' },
  { id: 'builder', label: '场景编排', icon: Cuboid, path: '/builder' },
  { id: 'ecosystem', label: '开发者生态', icon: Activity, path: '/ecosystem' },
];

const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate, isOpen }) => {
  return (
    <aside className={`fixed lg:relative z-30 w-64 h-full bg-slate-900 text-white transition-all duration-300 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-blue-500/30">
            <span className="font-bold text-white text-lg">T</span>
        </div>
        <span className="font-bold text-lg tracking-wide">天工·弈控</span>
      </div>

      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
              <span className="font-medium text-sm">{item.label}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>}
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <Settings size={20} />
            <span className="font-medium text-sm">系统设置</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;