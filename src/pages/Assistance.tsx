import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle, Headphones, MessageCircle, Mail, Phone, Clock, Shield, Truck, FileText, User } from 'lucide-react';

const Assistance = () => {
  const faqs = [
    {
      question: 'What does Embolo do?',
      answer: 'Embolo is a delivery and SaaS solutions company transforming the pharmaceutical supply chain in India. We bridge the gap between distributors and chemists with a seamless platform for faster, smarter, and more reliable medicine delivery. Our technology empowers distributors to manage logistics efficiently while giving chemists tools to track deliveries and reduce delays.',
    },
    {
      question: 'What are the payment options on Embolo.in, and how can I trust my money is safe?',
      answer: 'Embolo.in is a delivery and SaaS platform supporting the pharmaceutical supply chain. We act solely as a delivery partner connecting distributors and chemists. We do not manufacture, sell, or facilitate returns of medicines. All sales, cancellations, and return-related matters are handled directly by the chemists or distributors. Our role is limited to delivery and technology support.',
    },
    {
      question: 'What happens if my medicine is unavailable or out of stock?',
      answer: 'If your selected medicine is out of stock, you will not receive the order and our system will notify you instantly. In case you place an order and the medicine becomes unavailable, you will receive a notification. We ensure you receive the exact quantity of medicines you order without compromise.',
    },
    {
      question: 'How can I contact Embolo staff for support?',
      answer: 'You can reach Embolo.in for any queries or support through:\n\n📧 Email: customersupport@embolo.in\n📞 Phone: +91 9417569770, +91 8847565660',
    },
    {
      question: 'How to login to Embolo?',
      answer: 'Go to the user tab, add new user with details like chemist license, expiry, shop name, and shop location. Click login to successfully create an account. Once done, users can login through any device by entering their phone number and OTP.',
    },
  ];

  const handleContactSupport = () => {
    window.location.href = 'mailto:customersupport@embolo.in';
  };

  const handleCallSupport = () => {
    window.open('tel:+917307692617');
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: '"Roboto", sans-serif', fontWeight: 400 }}>
      <main className="container mx-auto px-4 py-6 space-y-8">

        {/* ✅ Professional Header with Bottom Line */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-[#00aa63] p-2 rounded-lg">
              <Headphones className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
          </div>
          
          <div className="border-b border-gray-300 pb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Clock className="w-4 h-4" />
              <span>24/7 Customer Support</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              We're here to make your medicine delivery experience fast, safe, and reliable. 
              Whether you need help with tracking your order, changing delivery details, 
              uploading prescriptions, or understanding our delivery process, our support 
              team is ready to assist you.
            </p>
          </div>
        </div>

        {/* ✅ Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="bg-[#00aa63] bg-opacity-10 p-2 rounded-lg inline-flex mb-2">
                <Truck className="w-5 h-5 text-[#00aa63]" />
              </div>
              <p className="text-xs font-medium text-gray-700">Track Order</p>
            </CardContent>
          </Card>

          <Card className="rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="bg-[#00aa63] bg-opacity-10 p-2 rounded-lg inline-flex mb-2">
                <User className="w-5 h-5 text-[#00aa63]" />
              </div>
              <p className="text-xs font-medium text-gray-700">Account Help</p>
            </CardContent>
          </Card>
        </div>

        {/* ✅ Fluent Support iframe - Blended Design */}
        <Card className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b border-gray-200 py-3 px-4">
            <CardTitle className="flex items-center gap-2 text-gray-900 text-base font-semibold">
              <div className="bg-[#00aa63] p-1.5 rounded">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              Create Support Ticket
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full bg-white">
              <iframe
                src="https://embolo.in/ss-2/"
                title="Support Ticket System"
                className="w-full h-[500px] border-0"
                loading="lazy"
                style={{ 
                  fontFamily: '"Roboto", sans-serif',
                  fontWeight: 400
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* ✅ Professional FAQ Section */}
        <Card className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b border-gray-200 py-3 px-4">
            <CardTitle className="flex items-center gap-2 text-gray-900 text-base font-semibold">
              <div className="bg-[#00aa63] p-1.5 rounded">
                <HelpCircle className="w-4 h-4 text-white" />
              </div>
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <Accordion type="single" collapsible className="w-full space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="border border-gray-200 rounded-lg px-3 hover:border-gray-300 transition-colors"
                >
                  <AccordionTrigger className="text-left text-gray-800 hover:text-gray-900 py-3 text-sm font-medium">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 text-sm pb-3 leading-relaxed whitespace-pre-line">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* ✅ Professional Contact Section */}
        <Card className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-[#00aa63] py-4 px-4">
            <CardTitle className="flex items-center gap-2 text-white text-base font-semibold">
              <Shield className="w-4 h-4" />
              Need Additional Help?
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 bg-white">
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Our dedicated support team is available around the clock to assist with any questions 
              about your orders, deliveries, or account issues.
            </p>
            <div className="space-y-3">
              <Button
                onClick={handleContactSupport}
                className="w-full h-11 bg-[#00aa63] hover:bg-[#009955] text-white font-medium text-sm"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email: customersupport@embolo.in
              </Button>
              <Button
                onClick={handleCallSupport}
                variant="outline"
                className="w-full h-11 border-[#00aa63] text-[#00aa63] hover:bg-[#00aa63] hover:text-white font-medium text-sm"
              >
                <Phone className="w-4 h-4 mr-2" />
                Call: +91 73076 92617
              </Button>
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Typical response time: under 2 hours
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ✅ Footer Information */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-500">
            Embolo Help Center • v2.1.4
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Secure • Reliable • Fast Delivery
          </p>
        </div>

      </main>
    </div>
  );
};

export default Assistance;