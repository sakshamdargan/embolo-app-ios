import { NavLink, useLocation } from 'react-router-dom';
import { Home, Zap, MessageCircle, Package, ShoppingCart, Wallet } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { Badge } from '@/components/ui/badge';

const Navbar = () => {
  const totalItems = useCartStore((state) => state.getTotalItems());
  const location = useLocation();
  
  // Hide navbar on checkout page
  const isCheckoutPage = location.pathname === '/checkout';

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/quick', icon: Zap, label: 'Quick' },
    { path: '/assistance', icon: MessageCircle, label: 'Assistance' },
    { path: '/orders', icon: Package, label: 'Orders' },
    { path: '/wallet', icon: Wallet, label: 'Wallet' },
  ];

  // Don't render navbar on checkout page
  if (isCheckoutPage) {
    return null;
  }

  return (
    <>
      {/* Floating Cart Button */}
      <NavLink
        to="/checkout"
        className="fixed bottom-20 right-4 z-50 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:scale-110 transition-transform"
      >
        <ShoppingCart className="w-6 h-6" />
        {totalItems > 0 && (
          <Badge className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center p-0">
            {totalItems}
          </Badge>
        )}
      </NavLink>

      {/* Bottom Navigation Bar */}
      <nav id="app-footer" className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1 font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
