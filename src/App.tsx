import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Quick from "./pages/Quick";
import Assistance from "./pages/Assistance";
import User from "./pages/User";
import AboutUs from "./pages/AboutUs";
import Updates from "./pages/Updates";
import Navbar from "./components/Navbar";
import Layout from "./components/Layout";
import Header from "./components/Header";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <div className="relative">
          <Header />
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/orders" element={<Orders />} />
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
