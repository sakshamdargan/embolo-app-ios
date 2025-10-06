import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const HeroBanner = () => {
  const navigate = useNavigate();

  return (
    <div className="gradient-primary rounded-2xl p-8 mb-6 shadow-lg">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">
            Welcome to Embolo
          </h1>
          <p className="text-primary-foreground/90 text-base">
            Your trusted pharmacy for quality medicines
          </p>
        </div>
        <Button
          onClick={() => navigate('/search')}
          className="bg-card text-primary hover:bg-card/90 w-fit shadow-md"
          size="lg"
        >
          <ShoppingBag className="w-5 h-5 mr-2" />
          Shop Now
        </Button>
      </div>
    </div>
  );
};

export default HeroBanner;
