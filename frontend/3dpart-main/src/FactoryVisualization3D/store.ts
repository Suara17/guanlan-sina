import { create } from 'zustand';
import { Factory, Workshop, WorkshopLine, GLOBAL_DATA, MOCK_DATA } from './factoryData';

interface FactoryState {
  level: 'global' | 'factory' | 'workshop' | 'line';
  selectedFactory: Factory | null;
  selectedWorkshop: Workshop | null;
  selectedLine: WorkshopLine | null;
  data: GLOBAL_DATA;
  
  // Actions
  setLevel: (level: 'global' | 'factory' | 'workshop' | 'line') => void;
  drillDownToFactory: (factory: Factory) => void;
  drillDownToWorkshop: (workshop: Workshop) => void;
  drillDownToLine: (line: WorkshopLine) => void;
  goBack: () => void;
}

export const useFactoryStore = create<FactoryState>((set, get) => ({
  level: 'global',
  selectedFactory: null,
  selectedWorkshop: null,
  selectedLine: null,
  data: MOCK_DATA,

  setLevel: (level) => set({ level }),

  drillDownToFactory: (factory) => {
    set({
      selectedFactory: factory,
      level: 'factory',
      selectedWorkshop: null,
      selectedLine: null
    });
  },

  drillDownToWorkshop: (workshop) => {
    set({ 
      selectedWorkshop: workshop, 
      level: 'workshop',
      selectedLine: null 
    });
  },

  drillDownToLine: (line) => {
    set({ 
      selectedLine: line, 
      level: 'line' 
    });
  },

  goBack: () => {
    const { level } = get();
    if (level === 'line') {
      set({ level: 'workshop', selectedLine: null });
    } else if (level === 'workshop') {
      set({ level: 'factory', selectedWorkshop: null });
    } else if (level === 'factory') {
      set({ level: 'global', selectedFactory: null });
    }
  },
}));
