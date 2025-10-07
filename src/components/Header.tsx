import { ShoppingCart, User, Menu } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SearchBar from '@/components/SearchBar';
import emboloLogo from './embolo.png';
import { UserCircle } from 'lucide-react';

const Header = () => {
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const navigate = useNavigate();
  const { getTotalItems } = useCartStore();
  const cartItemCount = getTotalItems();

  return (
    <header id="app-header" className="fixed top-0 left-0 right-0 z-40 bg-white shadow-md">
      <div className="container mx-auto px-4 py-2">
        {/* Row 1: Logo + Icons */}
        <div className="h-12 flex items-center justify-between font-semibold">
          <div 
            className="cursor-pointer"
            onClick={() => navigate('/')}
          >
            <img 
              src={emboloLogo} 
              alt="embolo" 
              className="h-10 w-auto" // Adjusted for mobile view
            />
          </div>
          <div className="flex items-center gap-1 pr-1 sm:gap-2 sm:pr-2 md:gap-2.5 md:pr-3 [font-style:normal] [font-weight:600] [font-variant:normal] [text-transform:none] [line-height:1]">
            <Button
              variant="ghost"
              size="large"
              onClick={() => navigate('/user')}
              className="relative text-black hover:bg-gray-100 p-2 font-semibold [font-style:normal] [font-weight:600] [font-variant:normal] [text-transform:none] [line-height:1]"
            >
              <UserCircle  className="!w-6 !h-6"  strokeWidth={2.5} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/cart')}
              className="relative text-black hover:bg-gray-100 p-2 font-semibold [font-style:normal] [font-weight:600] [font-variant:normal] [text-transform:none] [line-height:1]"
            >
              <ShoppingCart className="!w-6 !h-6" strokeWidth={2.5} />
              <Badge className="absolute -top-1 -right-1 bg-green-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                {cartItemCount}
              </Badge>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-black hover:bg-gray-100 p-2 font-semibold [font-style:normal] [font-weight:600] [font-variant:normal] [text-transform:none] [line-height:1]"
            >
              <Menu className="!w-6 !h-6" strokeWidth={2.5} />
            </Button>
          </div>
        </div>
        {/* Row 2: Search Bar */}
        <div className="pb-2 mt-[5px]">
          <SearchBar
            value={headerSearchQuery}
            onChange={setHeaderSearchQuery}
            placeholder="Search products..."
          />
        </div>
      </div>
    </header>
  );
};

export default Header;