import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./mobile.css";
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

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

// Initialize app first
initializeApp();

// Render React app with built-in loader
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
