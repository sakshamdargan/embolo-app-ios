import { useState, useEffect, useCallback } from 'react';

interface OfflineDetectionState {
  isOffline: boolean;
  lastOnlineTime: Date | null;
  offlineDuration: number;
}

export const useOfflineDetection = () => {
  const [state, setState] = useState<OfflineDetectionState>({
    isOffline: !navigator.onLine,
    lastOnlineTime: navigator.onLine ? new Date() : null,
    offlineDuration: 0
  });

  const updateOnlineStatus = useCallback(() => {
    const isCurrentlyOnline = navigator.onLine;
    const now = new Date();
    
    console.log(`[OfflineDetection] Network status changed: ${isCurrentlyOnline ? 'ONLINE' : 'OFFLINE'} at ${now.toLocaleTimeString()}`);
    
    setState(prevState => {
      if (isCurrentlyOnline && prevState.isOffline) {
        // Coming back online
        const offlineDuration = prevState.lastOnlineTime 
          ? Math.floor((now.getTime() - prevState.lastOnlineTime.getTime()) / 1000)
          : 0;
        
        console.log(`[OfflineDetection] Reconnected after ${offlineDuration} seconds offline`);
        
        return {
          isOffline: false,
          lastOnlineTime: now,
          offlineDuration
        };
      } else if (!isCurrentlyOnline && !prevState.isOffline) {
        // Going offline
        console.log('[OfflineDetection] Connection lost, entering offline mode');
        
        return {
          isOffline: true,
          lastOnlineTime: prevState.lastOnlineTime,
          offlineDuration: 0
        };
      }
      
      return prevState;
    });
  }, []);

  // Periodic connectivity check (every 10 seconds)
  const performConnectivityCheck = useCallback(async () => {
    try {
      // Try to fetch a small resource to verify actual connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch('https://embolo.in/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // If we reach here, we have connectivity
      if (state.isOffline) {
        console.log('[OfflineDetection] Periodic check: Connection restored');
        updateOnlineStatus();
      }
    } catch (error) {
      // Network request failed
      if (!state.isOffline) {
        console.log('[OfflineDetection] Periodic check: Connection lost');
        setState(prevState => ({
          ...prevState,
          isOffline: true
        }));
      }
    }
  }, [state.isOffline, updateOnlineStatus]);

  useEffect(() => {
    console.log('[OfflineDetection] Initializing offline detection system');
    console.log(`[OfflineDetection] Initial state: ${navigator.onLine ? 'ONLINE' : 'OFFLINE'}`);

    // Add event listeners for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Set up periodic connectivity checks
    const intervalId = setInterval(performConnectivityCheck, 10000);

    // Cleanup function
    return () => {
      console.log('[OfflineDetection] Cleaning up offline detection system');
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(intervalId);
    };
  }, [updateOnlineStatus, performConnectivityCheck]);

  // iOS-specific: Handle app state changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // App became visible, check connectivity
        console.log('[OfflineDetection] App became visible, checking connectivity');
        setTimeout(performConnectivityCheck, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [performConnectivityCheck]);

  return {
    isOffline: state.isOffline,
    lastOnlineTime: state.lastOnlineTime,
    offlineDuration: state.offlineDuration,
    checkConnectivity: performConnectivityCheck
  };
};
