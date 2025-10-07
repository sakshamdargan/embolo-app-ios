import { Building2, Zap, Clock, Package, Smartphone, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';

const AboutUs = () => {
  const features = [
    {
      icon: Zap,
      title: "Smart & Automated Platform",
      description: "Single app for wholesalers to manage stock, billing, and automate processes—cutting costs, reducing manual work, and replacing slip collection & phone calls."
    },
    {
      icon: Clock,
      title: "Quick Order & Price Compare",
      description: "Chemists can check stock, compare prices, discounts, and schemes, then place orders with preferred wholesalers in under 15 seconds."
    },
    {
      icon: Package,
      title: "Fast & Reliable Delivery",
      description: "Medicines delivered within 2 hours with live tracking—far quicker than traditional 1+ day delivery, ensuring chemists never run out of stock."
    },
    {
      icon: Building2,
      title: "Integrated Management",
      description: "Easily manage purchases, returns, and expired stock with automated records—no more manual record-keeping."
    },
    {
      icon: Smartphone,
      title: "All-in-One Platform",
      description: "Manage billing, orders, delivery, and staff in a single app instead of juggling multiple costly software."
    },
    {
      icon: DollarSign,
      title: "Cheaper & Time-Efficient",
      description: "Reduce workforce dependency and cut costs compared to traditional software and manual processes."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="gradient-primary text-white py-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            The Future of Pharma Supply
          </h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Embolo is building India's fastest, smartest, and most reliable B2B pharma supply platform. 
            We connect chemists and wholesalers through automation, real-time inventory, and super-fast 
            delivery — reducing costs, saving time, and ensuring medicines reach customers without delay.
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="gradient-primary rounded-full p-4 mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="gradient-primary text-white py-12 px-4 mt-12">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Pharma Business?
          </h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            Join thousands of chemists and wholesalers who are already experiencing 
            the future of pharma supply.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
