import React from 'react';
import { useOfflineContext } from '../contexts/OfflineContext';
import OfflineLoader from './OfflineLoader';
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Home from "../pages/Home";
import Checkout from "../pages/Checkout";
import Orders from "../pages/Orders";
import Quick from "../pages/Quick";
import Assistance from "../pages/Assistance";
import User from "../pages/User";
import AboutUs from "../pages/AboutUs";
import Updates from "../pages/Updates";
import Wallet from "../pages/Wallet";
import Navbar from "./Navbar";
import Layout from "./Layout";
import Header from "./Header";
import NotFound from "../pages/NotFound";
import CashbackIntegration, { CashbackIntegrationRef } from "./cashback/CashbackIntegration";
import { useRef, useEffect } from "react";

const AppWithOffline: React.FC = () => {
  const { isOffline, offlineDuration } = useOfflineContext();
  const globalCashbackRef = useRef<CashbackIntegrationRef>(null);

  // Expose global cashback trigger function
  useEffect(() => {
    (window as any).globalCashbackRef = globalCashbackRef;
    
    return () => {
      delete (window as any).globalCashbackRef;
    };
  }, []);

  return (
    <>
      {/* Main App Content */}
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

      {/* Offline Loader - Shows when connection is lost */}
      <OfflineLoader 
        isVisible={isOffline} 
        offlineDuration={offlineDuration}
      />
    </>
  );
};

export default AppWithOffline;
