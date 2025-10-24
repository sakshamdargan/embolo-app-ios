import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { OfflineProvider } from "./contexts/OfflineContext";
import AppLoader from "./components/AppLoader";
import AppWithOffline from "./components/AppWithOffline";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

const App = () => {
  // 🔄 SLIDING SESSION: Token automatically extends on every API call (see service interceptors)
  // No background refresh needed!
  
  const [showLoader, setShowLoader] = useState(true);

  const handleLoadComplete = () => {
    setShowLoader(false);
  };

  return (
    <>
      {/* App loads in background */}
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner position="top-center" />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <OfflineProvider>
              <AuthProvider>
                <AppWithOffline />
              </AuthProvider>
            </OfflineProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>

      {/* Loader overlays on top while app loads */}
      {showLoader && <AppLoader onLoadComplete={handleLoadComplete} />}
    </>
  );
};

export default App;
