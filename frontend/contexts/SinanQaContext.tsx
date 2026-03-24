import type React from 'react'
import { createContext, useContext } from 'react'

type SinanQaPageContextValue = {
  setPageContext: (context: Record<string, unknown>) => void
  clearPageContext: () => void
}

const SinanQaPageContext = createContext<SinanQaPageContextValue | null>(null)

interface SinanQaPageContextProviderProps {
  children: React.ReactNode
  value: SinanQaPageContextValue
}

export const SinanQaPageContextProvider: React.FC<SinanQaPageContextProviderProps> = ({
  children,
  value,
}) => <SinanQaPageContext.Provider value={value}>{children}</SinanQaPageContext.Provider>

export const useSinanQaPageContext = (): SinanQaPageContextValue => {
  const context = useContext(SinanQaPageContext)
  if (!context) {
    throw new Error('useSinanQaPageContext must be used within SinanQaPageContextProvider')
  }
  return context
}
