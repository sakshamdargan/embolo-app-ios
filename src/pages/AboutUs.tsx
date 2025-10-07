import { Building2, Zap, Clock, Package, Smartphone, DollarSign, Target, Users, TrendingUp, Shield, Heart, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import emboloLogo from '@/components/embolo.png';

const AboutUs = () => {
  const features = [
    {
      icon: Zap,
      title: "Smart & Automated",
      description: "Single app for wholesalers to manage stock, billing, and automate processes—cutting costs and reducing manual work."
    },
    {
      icon: Clock,
      title: "Quick Order",
      description: "Check stock, compare prices, and place orders with preferred wholesalers in under 15 seconds."
    },
    {
      icon: Package,
      title: "Fast Delivery",
      description: "Medicines delivered within 2 hours with live tracking—ensuring you never run out of stock."
    },
    {
      icon: Building2,
      title: "Integrated Management",
      description: "Manage purchases, returns, and expired stock with automated records—no manual work."
    },
    {
      icon: Smartphone,
      title: "All-in-One Platform",
      description: "Manage billing, orders, delivery, and staff in a single app instead of multiple software."
    },
    {
      icon: DollarSign,
      title: "Cost Efficient",
      description: "Reduce workforce dependency and cut costs compared to traditional processes."
    }
  ];

  const stats = [
    { number: "2 Hours", label: "Delivery Time" },
    { number: "15 Sec", label: "Order Placement" },
    { number: "24/7", label: "Support Available" },
    { number: "100%", label: "Secure Platform" }
  ];

  const values = [
    {
      icon: Target,
      title: "Our Mission",
      description: "To revolutionize pharma supply chain with technology, making medicines accessible faster and more efficiently."
    },
    {
      icon: Users,
      title: "Customer First",
      description: "We prioritize our customers' needs, ensuring seamless experience and reliable service at every step."
    },
    {
      icon: Shield,
      title: "Trust & Security",
      description: "Your data and transactions are protected with industry-leading security measures."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: '"Roboto", sans-serif', fontWeight: 400 }}>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#00aa63] to-[#008f52] text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col items-center text-center space-y-6">
            <img 
              src={emboloLogo} 
              alt="Embolo" 
              className="h-20 w-auto filter brightness-0 invert"
            />
            <h1 className="text-3xl md:text-5xl font-bold">
              The Future of Pharma Supply
            </h1>
            <p className="text-base md:text-lg max-w-3xl leading-relaxed opacity-95">
              Embolo is building India's fastest, smartest, and most reliable B2B pharma supply platform. 
              We connect chemists and wholesalers through automation, real-time inventory, and super-fast 
              delivery — reducing costs, saving time, and ensuring medicines reach customers without delay.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-lg">
              <CardContent className="p-4 md:p-6 text-center">
                <div className="text-2xl md:text-3xl font-bold text-[#00aa63] mb-1">
                  {stat.number}
                </div>
                <div className="text-xs md:text-sm text-gray-600 font-medium">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Values Section */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-gray-900">
          What Drives Us
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <Card key={index} className="border-none shadow-md hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="bg-[#00aa63]/10 rounded-full p-4">
                      <Icon className="w-8 h-8 text-[#00aa63]" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {value.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3 text-gray-900">
            Why Choose Embolo?
          </h2>
          <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
            Experience the next generation of pharma supply chain management
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index} 
                  className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#00aa63]"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="bg-[#00aa63]/10 rounded-lg p-3 flex-shrink-0">
                        <Icon className="w-6 h-6 text-[#00aa63]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-2 text-gray-900">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-[#00aa63] to-[#008f52] text-white py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white/20 rounded-full p-4">
              <Heart className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Transform Your Pharma Business?
          </h2>
          <p className="text-base md:text-lg mb-6 max-w-2xl mx-auto opacity-95">
            Join thousands of chemists and wholesalers who are already experiencing 
            the future of pharma supply.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span>Trusted Platform</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <span>Growing Network</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span>100% Secure</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
