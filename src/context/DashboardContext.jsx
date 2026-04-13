/**
 * DashboardContext
 *
 * Centralizes all shared state across the dashboard:
 *  - Selected drivers (up to 5)
 *  - Hover sync: hovering one chart highlights the same distance on all others
 *  - Active overlay mode for the track map
 *
 * Why context?
 * When a user hovers over the speed chart, we want the tyre degradation chart,
 * the delta chart, and the throttle chart to all show a synchronized cursor.
 * Lifting this state to a context avoids prop-drilling 6 levels deep.
 */

import { createContext, useContext, useState, useCallback } from 'react';
import { DEFAULT_DRIVERS } from '../utils/colors.js';

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [selectedDrivers, setSelectedDrivers] = useState(DEFAULT_DRIVERS);

  // Shared hover state: { distIndex, x } — index into the subsampled dist array
  const [hoverIndex, setHoverIndex] = useState(null);

  // Track map overlay mode
  const [mapMode, setMapMode] = useState('speed'); // speed | throttle | brake | gear | drs

  // Currently expanded insight (for detail panel)
  const [activeInsight, setActiveInsight] = useState(null);

  const addDriver = useCallback((code) => {
    setSelectedDrivers(prev =>
      prev.includes(code) || prev.length >= 5 ? prev : [...prev, code]
    );
  }, []);

  const removeDriver = useCallback((code) => {
    setSelectedDrivers(prev => prev.length <= 2 ? prev : prev.filter(d => d !== code));
  }, []);

  const toggleDriver = useCallback((code) => {
    setSelectedDrivers(prev => {
      if (prev.includes(code)) {
        return prev.length <= 2 ? prev : prev.filter(d => d !== code);
      }
      return prev.length >= 5 ? prev : [...prev, code];
    });
  }, []);

  return (
    <DashboardContext.Provider value={{
      selectedDrivers, setSelectedDrivers,
      addDriver, removeDriver, toggleDriver,
      hoverIndex, setHoverIndex,
      mapMode, setMapMode,
      activeInsight, setActiveInsight,
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}
