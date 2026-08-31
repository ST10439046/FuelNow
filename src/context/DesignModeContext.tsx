import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Colors, Fonts, WireframeColors } from '../theme/tokens';

export type DesignMode = 'WIREFRAME' | 'HIGH_FIDELITY';

interface DesignModeContextValue {
  mode: DesignMode;
  toggleMode: () => void;
  isWireframe: boolean;
  /** Returns the correct color palette based on current mode */
  colors: typeof Colors;
  /** Returns font family — system font in wireframe, branded in hi-fi */
  font: (variant: keyof typeof Fonts) => string | undefined;
}

const DesignModeContext = createContext<DesignModeContextValue | null>(null);

export function DesignModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<DesignMode>('HIGH_FIDELITY');

  const toggleMode = () =>
    setMode((prev) => (prev === 'HIGH_FIDELITY' ? 'WIREFRAME' : 'HIGH_FIDELITY'));

  const isWireframe = mode === 'WIREFRAME';

  const colors = isWireframe ? (WireframeColors as typeof Colors) : Colors;

  const font = (variant: keyof typeof Fonts): string | undefined => {
    if (isWireframe) return undefined; // fall back to system default
    return Fonts[variant];
  };

  return (
    <DesignModeContext.Provider value={{ mode, toggleMode, isWireframe, colors, font }}>
      {children}
    </DesignModeContext.Provider>
  );
}

export function useDesignMode(): DesignModeContextValue {
  const ctx = useContext(DesignModeContext);
  if (!ctx) throw new Error('useDesignMode must be used within DesignModeProvider');
  return ctx;
}
