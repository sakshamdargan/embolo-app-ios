import { useState } from 'react';
import { Trash2, Minus, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCartStore } from '@/store/useCartStore';
import { api } from '@/utils/api';
import { toast } from 'sonner';

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
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="bg-primary/10 rounded-full p-6 mb-6">
            <ShoppingCart className="w-16 h-16 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8 max-w-sm">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Button onClick={() => window.history.back()} className="px-8">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24"> {/* Added padding bottom for floating button */}
      {/* Header with Icon and Title on the same line, centered */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-3">
            <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20">
              <ShoppingCart className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Cart</h1>
          </div>
          <p className="text-muted-foreground mt-2 text-center">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Darker Bordered Box */}
          <div className="border-2 border-gray-300 rounded-xl shadow-sm bg-card overflow-hidden">
            {/* Scrollable Cart Items */}
            <div className="max-h-[55vh] overflow-y-auto p-4 space-y-4">
              {items.map((item) => (
                <Card 
                  key={item.id} 
                  className="rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4 items-start">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0 border border-gray-200"
                      />
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        <h3 className="font-semibold text-sm sm:text-base line-clamp-2">{item.name}</h3>
                        {item.vendorName && (
                          <p className="text-xs text-muted-foreground">Sold by: {item.vendorName}</p>
                        )}
                        <p className="text-lg font-bold text-primary">
                          ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                          <span className="text-sm text-muted-foreground font-normal ml-2">
                            (${parseFloat(item.price).toFixed(2)} each)
                          </span>
                        </p>

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-muted/50">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="h-8 w-8 p-0 rounded-none hover:bg-muted border-r border-gray-300"
                            >
                              <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                            <span className="px-3 text-sm font-medium min-w-8 text-center bg-background">
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-8 w-8 p-0 rounded-none hover:bg-muted border-l border-gray-300"
                            >
                              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeItem(item.id)}
                            className="gap-1 sm:gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs sm:text-sm"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Total and Remove All Section - Same Row */}
          <div className="flex items-center justify-between gap-4 mt-6 p-4 bg-gray-50 rounded-lg border border-gray-300">
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold text-primary">${getTotalPrice().toFixed(2)}</p>
            </div>
            
            <Button
              variant="outline"
              onClick={clearCart}
              className="gap-2 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              Remove All
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Checkout Button - Always Visible */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 shadow-lg z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <Button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all rounded-xl"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                `Proceed to Checkout - $${getTotalPrice().toFixed(2)}`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;