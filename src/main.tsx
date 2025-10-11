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
  }
};

// Hide splash screen after React has rendered
const hideSplashScreen = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      // Small delay to ensure first paint is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      await SplashScreen.hide({
        fadeOutDuration: 300
      });
    } catch (error) {
      console.log('Splash screen not available:', error);
    }
  }
};

// Initialize app first
initializeApp();

// Render React app
const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Hide splash after React has rendered
requestAnimationFrame(() => {
  hideSplashScreen();
});
