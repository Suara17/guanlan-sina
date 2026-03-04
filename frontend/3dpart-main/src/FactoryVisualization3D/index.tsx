import React from 'react';
import { FactoryScene } from './FactoryScene';
import { useFactoryStore } from './store';
import { ChevronRight, ArrowLeft, Layers, Box, Activity, Globe, Factory } from 'lucide-react';

export const FactoryVisualization3D: React.FC = () => {
  const { level, selectedFactory, selectedWorkshop, selectedLine, goBack } = useFactoryStore();

  return (
    <div className="relative w-full h-screen flex flex-col">
      {/* Header / Breadcrumbs */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-slate-200">
        <button 
          onClick={() => useFactoryStore.getState().setLevel('global')}
          className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 ${level === 'global' ? 'font-bold text-blue-600' : 'text-slate-600'}`}
        >
          <Globe size={16} />
          <span>Global</span>
        </button>

        {level !== 'global' && (
          <>
            <ChevronRight size={16} className="text-slate-400" />
            <button 
              onClick={() => selectedFactory && useFactoryStore.getState().drillDownToFactory(selectedFactory)}
              className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 ${level === 'factory' ? 'font-bold text-blue-600' : 'text-slate-600'}`}
            >
              <Factory size={16} />
              <span>{selectedFactory?.name || 'Factory'}</span>
            </button>
          </>
        )}

        {(level === 'workshop' || level === 'line') && (
          <>
            <ChevronRight size={16} className="text-slate-400" />
            <button 
              onClick={() => selectedWorkshop && useFactoryStore.getState().drillDownToWorkshop(selectedWorkshop)}
              className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 ${level === 'workshop' ? 'font-bold text-blue-600' : 'text-slate-600'}`}
            >
              <Box size={16} />
              <span>{selectedWorkshop?.name || 'Workshop'}</span>
            </button>
          </>
        )}

        {level === 'line' && (
          <>
            <ChevronRight size={16} className="text-slate-400" />
            <div className="flex items-center gap-2 px-2 py-1 font-bold text-blue-600">
              <Activity size={16} />
              <span>{selectedLine?.name || 'Line'}</span>
            </div>
          </>
        )}
      </div>

      {/* Back Button (only when drilled down) */}
      {level !== 'global' && (
        <button 
          onClick={goBack}
          className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700"
        >
          <ArrowLeft size={20} />
        </button>
      )}

      {/* 3D Scene */}
      <div className="flex-1">
        <FactoryScene />
      </div>

      {/* Legend / Info Panel */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-200 text-sm">
        <h4 className="font-bold text-slate-800 mb-2">Status Legend</h4>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"></div>
            <span className="text-slate-600">Running</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]"></div>
            <span className="text-slate-600">Idle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
            <span className="text-slate-600">Error</span>
          </div>
        </div>
      </div>
    </div>
  );
};
