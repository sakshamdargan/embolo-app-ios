import { ShoppingCart, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Header = () => {
  const navigate = useNavigate();
  const { getTotalItems } = useCartStore();
  const cartItemCount = getTotalItems();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-primary shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <h1 
          className="text-2xl font-bold text-white cursor-pointer"
          onClick={() => navigate('/')}
        >
          Embolo
        </h1>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/cart')}
            className="relative text-white hover:bg-white/20"
          >
            <ShoppingCart className="w-6 h-6" />
            {cartItemCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {cartItemCount}
              </Badge>
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/user')}
            className="text-white hover:bg-white/20"
          >
            <User className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
