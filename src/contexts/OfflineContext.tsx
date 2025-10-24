import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useOfflineDetection } from '../hooks/useOfflineDetection';

interface OfflineContextType {
  isOffline: boolean;
  lastOnlineTime: Date | null;
  offlineDuration: number;
  sessionPreserved: boolean;
  lastRoute: string | null;
  checkConnectivity: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const { isOffline, lastOnlineTime, offlineDuration, checkConnectivity } = useOfflineDetection();
  const [sessionPreserved, setSessionPreserved] = useState(false);
  const [lastRoute, setLastRoute] = useState<string | null>(null);

  // Session preservation logic
  useEffect(() => {
    if (isOffline) {
      // Going offline - preserve current session state
      console.log('[OfflineContext] Preserving session state for offline mode');
      
      // Store current route
      const currentRoute = window.location.pathname;
      setLastRoute(currentRoute);
      localStorage.setItem('embolo_offline_route', currentRoute);
      
      // Preserve authentication token
      const existingToken = localStorage.getItem('embolo_auth_token');
      if (existingToken) {
        localStorage.setItem('embolo_offline_token', existingToken);
        console.log('[OfflineContext] Auth token preserved for offline session');
      }
      
      // Store offline timestamp
      localStorage.setItem('embolo_offline_timestamp', new Date().toISOString());
      
      setSessionPreserved(true);
    } else if (sessionPreserved) {
      // Coming back online - restore session
      console.log('[OfflineContext] Restoring session state after reconnection');
      
      // Restore authentication token if it was preserved
      const offlineToken = localStorage.getItem('embolo_offline_token');
      const currentToken = localStorage.getItem('embolo_auth_token');
      
      if (offlineToken && !currentToken) {
        localStorage.setItem('embolo_auth_token', offlineToken);
        console.log('[OfflineContext] Auth token restored from offline session');
      }
      
      // Navigate back to last route if different
      const preservedRoute = localStorage.getItem('embolo_offline_route');
      if (preservedRoute && preservedRoute !== window.location.pathname) {
        console.log(`[OfflineContext] Navigating back to preserved route: ${preservedRoute}`);
        // Use a small delay to ensure the app is fully loaded
        setTimeout(() => {
          window.history.pushState(null, '', preservedRoute);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }, 1000);
      }
      
      // Clean up offline storage
      localStorage.removeItem('embolo_offline_token');
      localStorage.removeItem('embolo_offline_route');
      localStorage.removeItem('embolo_offline_timestamp');
      
      setSessionPreserved(false);
    }
  }, [isOffline, sessionPreserved]);

  // Monitor route changes to update last route
  useEffect(() => {
    const handleRouteChange = () => {
      if (!isOffline) {
        setLastRoute(window.location.pathname);
      }
    };

    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange);
    
    // Also listen for programmatic navigation
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      handleRouteChange();
    };
    
    window.history.replaceState = function(...args) {
      originalReplaceState.apply(window.history, args);
      handleRouteChange();
    };

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [isOffline]);

  // Periodic session validation while offline
  useEffect(() => {
    if (!isOffline) return;

    const validateSession = () => {
      const offlineTimestamp = localStorage.getItem('embolo_offline_timestamp');
      if (offlineTimestamp) {
        const offlineTime = new Date(offlineTimestamp);
        const now = new Date();
        const offlineMinutes = Math.floor((now.getTime() - offlineTime.getTime()) / (1000 * 60));
        
        // Log session status every 5 minutes while offline
        if (offlineMinutes > 0 && offlineMinutes % 5 === 0) {
          console.log(`[OfflineContext] Session preserved for ${offlineMinutes} minutes offline`);
        }
        
        // Warn if offline for more than 30 minutes
        if (offlineMinutes > 30) {
          console.warn('[OfflineContext] Extended offline period detected - session may need refresh');
        }
      }
    };

    const interval = setInterval(validateSession, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [isOffline]);

  // iOS-specific: Handle app backgrounding/foregrounding
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App going to background
        if (!isOffline) {
          console.log('[OfflineContext] App backgrounded - preserving current state');
          localStorage.setItem('embolo_background_route', window.location.pathname);
        }
      } else {
        // App coming to foreground
        console.log('[OfflineContext] App foregrounded - checking connectivity');
        setTimeout(checkConnectivity, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isOffline, checkConnectivity]);

  const contextValue: OfflineContextType = {
    isOffline,
    lastOnlineTime,
    offlineDuration,
    sessionPreserved,
    lastRoute,
    checkConnectivity
  };

  return (
    <OfflineContext.Provider value={contextValue}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOfflineContext = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOfflineContext must be used within an OfflineProvider');
  }
  return context;
};

export default OfflineContext;
