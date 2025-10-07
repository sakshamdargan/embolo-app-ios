import { ShoppingBag, Pill, HeartPulse, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const HeroBanner = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Main Hero Banner */}
      <div className="gradient-primary rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5 bg-cover bg-center" />
        <div className="relative z-10 flex flex-col gap-6">
          <div className="space-y-3">
            <div className="inline-block bg-primary-foreground/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <p className="text-primary-foreground text-sm font-semibold">🎉 Special Offers Available</p>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground leading-tight">
              Your stock,
              <br />
              Our Priority
            </h1>
            <p className="text-primary-foreground/90 text-lg max-w-md">
            Find the right distributor for your store. 
            Track orders, find suppliers and restock faster! 
            </p>
          </div>
          <div className="flex gap-2 md:gap-3">
            <Button
              onClick={() => navigate('/search')}
              className="bg-card text-primary hover:bg-card/90 shadow-lg hover:shadow-xl transition-all text-sm md:text-base px-4 md:px-6"
              size="default"
            >
              <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
              Shop Now
            </Button>
            <Button
              onClick={() => navigate('/orders')}
              variant="outline"
              className="bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary shadow-lg text-sm md:text-base px-4 md:px-6"
              size="default"
            >
              View Orders
            </Button>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-2xl p-4 shadow-md text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
            <Pill className="w-6 h-6 text-primary" />
          </div>
          <p className="text-xs font-semibold text-foreground">Genuine Products</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-md text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
            <Truck className="w-6 h-6 text-primary" />
          </div>
          <p className="text-xs font-semibold text-foreground">Fast Delivery</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-md text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
            <HeartPulse className="w-6 h-6 text-primary" />
          </div>
          <p className="text-xs font-semibold text-foreground">Expert Care</p>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
