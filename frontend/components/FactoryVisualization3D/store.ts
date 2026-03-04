import { create } from 'zustand'
import {
  type Factory,
  type GLOBAL_DATA,
  MOCK_DATA,
  type Workshop,
  type WorkshopLine,
} from './factoryData'

interface FactoryState {
  level: 'global' | 'factory' | 'workshop' | 'line'
  selectedFactory: Factory | null
  selectedWorkshop: Workshop | null
  selectedLine: WorkshopLine | null
  cameraResetToken: number
  data: GLOBAL_DATA

  // Actions
  setLevel: (level: 'global' | 'factory' | 'workshop' | 'line') => void
  drillDownToFactory: (factory: Factory) => void
  drillDownToWorkshop: (workshop: Workshop) => void
  drillDownToLine: (line: WorkshopLine) => void
  goBack: () => void
  resetToGlobalView: () => void
}

export const useFactoryStore = create<FactoryState>((set, get) => ({
  level: 'global',
  selectedFactory: null,
  selectedWorkshop: null,
  selectedLine: null,
  cameraResetToken: 0,
  data: MOCK_DATA,

  setLevel: (level) => {
    if (level === 'global') {
      set((state) => ({
        level: 'global',
        selectedFactory: null,
        selectedWorkshop: null,
        selectedLine: null,
        cameraResetToken: state.cameraResetToken + 1,
      }))
      return
    }
    if (level === 'factory') {
      set({
        level: 'factory',
        selectedWorkshop: null,
        selectedLine: null,
      })
      return
    }
    if (level === 'workshop') {
      set({
        level: 'workshop',
        selectedLine: null,
      })
      return
    }
    set({ level: 'line' })
  },

  drillDownToFactory: (factory) => {
    set({
      selectedFactory: factory,
      level: 'factory',
      selectedWorkshop: null,
      selectedLine: null,
    })
  },

  drillDownToWorkshop: (workshop) => {
    set({
      selectedWorkshop: workshop,
      level: 'workshop',
      selectedLine: null,
    })
  },

  drillDownToLine: (line) => {
    set({
      selectedLine: line,
      level: 'line',
    })
  },

  goBack: () => {
    const { level } = get()
    if (level === 'line') {
      set({ level: 'workshop', selectedLine: null })
    } else if (level === 'workshop') {
      set({ level: 'factory', selectedWorkshop: null })
    } else if (level === 'factory') {
      set((state) => ({
        level: 'global',
        selectedFactory: null,
        selectedWorkshop: null,
        selectedLine: null,
        cameraResetToken: state.cameraResetToken + 1,
      }))
    }
  },

  resetToGlobalView: () => {
    set((state) => ({
      level: 'global',
      selectedFactory: null,
      selectedWorkshop: null,
      selectedLine: null,
      cameraResetToken: state.cameraResetToken + 1,
    }))
  },
}))
