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
    // Hide splash screen immediately
    try {
      await SplashScreen.hide();
    } catch (error) {
      console.log('Splash screen not available:', error);
    }
    
    // Configure Status Bar - transparent like native iOS apps
    try {
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setOverlaysWebView({ overlay: true });
    } catch (error) {
      console.log('Status bar not available:', error);
    }
  }
};

// Initialize app first
initializeApp();

// Render React app with built-in loader
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
