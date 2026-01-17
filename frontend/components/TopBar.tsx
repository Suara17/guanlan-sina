import React from 'react';
import { Bell, Search, User, Menu } from 'lucide-react';

interface TopBarProps {
  title: string;
  toggleSidebar: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ title, toggleSidebar }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-md">
            <Menu size={20} />
        </button>
        <h2 className="text-xl font-semibold text-slate-800 tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="全局搜索..." 
            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64 transition-all"
          />
        </div>
        
        <button className="relative p-2 text-slate-500 hover:text-blue-600 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-700">演示用户</p>
            <p className="text-xs text-slate-400">工厂管理员</p>
          </div>
          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 border border-blue-200">
            <User size={18} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
