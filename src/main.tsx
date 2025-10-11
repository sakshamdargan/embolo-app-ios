import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./mobile.css";
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

// Initialize Capacitor plugins
const initializeApp = async () => {
  if (Capacitor.isNativePlatform()) {
    // Configure Status Bar
    try {
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#00aa63' });
      await StatusBar.setOverlaysWebView({ overlay: false });
    } catch (error) {
      console.log('Status bar not available:', error);
    }

    // Hide splash screen immediately when app is ready
    try {
      await SplashScreen.hide({
        fadeOutDuration: 200
      });
    } catch (error) {
      console.log('Splash screen not available:', error);
    }
  }
};

initializeApp();

createRoot(document.getElementById("root")!).render(<App />);
