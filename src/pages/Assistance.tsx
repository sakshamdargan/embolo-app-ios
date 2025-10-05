import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { MessageCircle, Mail, Phone, HelpCircle } from 'lucide-react';

const Assistance = () => {
  const faqs = [
    {
      question: 'How do I place an order?',
      answer:
        'Browse products, add items to your cart, and proceed to checkout. Orders are placed as "Pending Payment" and you can pay Cash on Delivery.',
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        'Currently, we only accept Cash on Delivery (COD). Payment is collected when your order is delivered.',
    },
    {
      question: 'How can I track my order?',
      answer:
        'Visit the Orders page to see all your orders and their current status. You can track the progress from pending to completed.',
    },
    {
      question: 'What is your return policy?',
      answer:
        'We offer returns within 7 days of delivery for unused items in original packaging. Contact support to initiate a return.',
    },
    {
      question: 'How do I contact a vendor?',
      answer:
        'Visit the Quick page to see all vendors. Click on a vendor to view their contact information and products.',
    },
  ];

  const handleContactSupport = () => {
    window.location.href = 'mailto:support@easdeal.com';
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/1234567890', '_blank');
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <header className="gradient-primary p-4">
        <h1 className="text-2xl font-bold text-white">Assistance</h1>
        <p className="text-white/90 text-sm mt-1">We're here to help</p>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Contact Options */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
          <div className="grid gap-4">
            <Card className="rounded-2xl">
              <CardContent className="p-4">
                <Button
                  onClick={handleWhatsApp}
                  className="w-full h-12 gap-3 bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle className="w-5 h-5" />
                  Chat on WhatsApp
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardContent className="p-4">
                <Button
                  onClick={handleContactSupport}
                  variant="outline"
                  className="w-full h-12 gap-3"
                >
                  <Mail className="w-5 h-5" />
                  Email Support
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardContent className="p-4">
                <Button
                  variant="outline"
                  className="w-full h-12 gap-3"
                  onClick={() => window.open('tel:+1234567890')}
                >
                  <Phone className="w-5 h-5" />
                  Call Us
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQs */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
          </div>

          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>

        {/* Help Center */}
        <section>
          <Card className="rounded-2xl gradient-primary text-white">
            <CardHeader>
              <CardTitle>Need More Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Our support team is available 24/7 to assist you with any questions or concerns.
              </p>
              <Button
                onClick={handleContactSupport}
                variant="secondary"
                className="w-full"
              >
                Visit Help Center
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Assistance;
