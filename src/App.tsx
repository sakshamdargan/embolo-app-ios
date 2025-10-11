import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Quick from "./pages/Quick";
import Assistance from "./pages/Assistance";
import User from "./pages/User";
import AboutUs from "./pages/AboutUs";
import Updates from "./pages/Updates";
import Wallet from "./pages/Wallet";
import Navbar from "./components/Navbar";
import Layout from "./components/Layout";
import Header from "./components/Header";
import NotFound from "./pages/NotFound";
import CashbackIntegration, { CashbackIntegrationRef } from "./components/cashback/CashbackIntegration";
import { useRef, useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  // 🔄 SLIDING SESSION: Token automatically extends on every API call (see service interceptors)
  // No background refresh needed!
  
  const globalCashbackRef = useRef<CashbackIntegrationRef>(null);

  // Expose global cashback trigger function
  useEffect(() => {
    (window as any).globalCashbackRef = globalCashbackRef;
    console.log('Global cashback ref exposed to window');
    
    return () => {
      delete (window as any).globalCashbackRef;
    };
  }, []);

  return (
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
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes - All app content requires authentication */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <div className="relative">
                    <Header />
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/orders" element={<Orders />} />
                        <Route path="/wallet" element={<Wallet />} />
                        <Route path="/quick" element={<Quick />} />
                        <Route path="/assistance" element={<Assistance />} />
                        <Route path="/user" element={<User />} />
                        <Route path="/about" element={<AboutUs />} />
                        <Route path="/updates" element={<Updates />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Layout>
                    <Navbar />
                  </div>
                </ProtectedRoute>
              } />
            </Routes>
            
            {/* Global Cashback Integration - Persists across all pages */}
            <CashbackIntegration 
              ref={globalCashbackRef}
              orderValue={0}
              showPreview={false}
            />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
