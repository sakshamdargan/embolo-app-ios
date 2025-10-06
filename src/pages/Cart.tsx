import { useState } from 'react';
import { Trash2, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCartStore } from '@/store/useCartStore';
import { api } from '@/utils/api';
import { toast } from 'sonner';
import SearchBarSection from '@/components/SearchBarSection';

const Cart = () => {
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCartStore();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      setLoading(true);
      
      // Create order with COD payment
      const orderData = {
        line_items: items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
        billing: {
          first_name: 'Customer',
          last_name: 'Name',
          email: 'customer@example.com',
          phone: '1234567890',
          address_1: 'Address Line 1',
          city: 'City',
          postcode: '12345',
          country: 'US',
        },
      };

      await api.createOrder(orderData);
      
      clearCart();
      toast.success('Order placed successfully! Payment pending.');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20 pt-24">
        <SearchBarSection />
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="text-center">
            <p className="text-xl font-semibold mb-2">Your cart is empty</p>
            <p className="text-muted-foreground">Add some products to get started</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <header className="gradient-primary p-6 shadow-md">
        <h1 className="text-2xl font-bold text-primary-foreground">Shopping Cart</h1>
        <p className="text-primary-foreground/90 text-sm mt-1">{items.length} items</p>
      </header>

      {/* Cart Items */}
      <main className="container mx-auto px-4 py-6 space-y-4">
        {items.map((item) => (
          <Card key={item.id} className="rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-sm line-clamp-2">{item.name}</h3>
                  {item.vendorName && (
                    <p className="text-xs text-muted-foreground">{item.vendorName}</p>
                  )}
                  <p className="text-lg font-bold text-primary">
                    ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center border border-border rounded-lg overflow-hidden">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="h-8 w-8 p-0 rounded-none"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="px-4 text-sm font-medium">{item.quantity}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="h-8 w-8 p-0 rounded-none"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => removeItem(item.id)}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </main>

      {/* Checkout Footer */}
      <div className="fixed bottom-16 left-0 right-0 bg-card border-t border-border p-4 z-30">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold">Total:</span>
            <span className="text-2xl font-bold text-primary">
              ${getTotalPrice().toFixed(2)}
            </span>
          </div>
          <Button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-lg font-semibold"
          >
            {loading ? 'Processing...' : 'Proceed to Checkout'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
