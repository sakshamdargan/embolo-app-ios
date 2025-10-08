import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/store/useCartStore';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/utils/api';
import { toast } from 'sonner';
import { 
  ShoppingCart, 
  MapPin, 
  User, 
  CreditCard, 
  Package,
  ArrowLeft,
  Loader2
} from 'lucide-react';

interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { items, clearCart, getTotalPrice } = useCartStore();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postcode: ''
  });

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
      return;
    }

    // Pre-fill customer info if user is logged in
    if (user) {
      setCustomerInfo(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || ''
      }));
    }
  }, [items, navigate, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const required = ['name', 'phone', 'email', 'address', 'city', 'state', 'postcode'];
    return required.every(field => customerInfo[field as keyof CustomerInfo].trim() !== '');
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      // Create order with customer details
      const orderData = {
        line_items: items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
        billing: {
          first_name: customerInfo.name.split(' ')[0] || customerInfo.name,
          last_name: customerInfo.name.split(' ').slice(1).join(' ') || '',
          email: customerInfo.email,
          phone: customerInfo.phone,
          address_1: customerInfo.address,
          city: customerInfo.city,
          state: customerInfo.state,
          postcode: customerInfo.postcode,
          country: 'IN',
        },
        shipping: {
          first_name: customerInfo.name.split(' ')[0] || customerInfo.name,
          last_name: customerInfo.name.split(' ').slice(1).join(' ') || '',
          address_1: customerInfo.address,
          city: customerInfo.city,
          state: customerInfo.state,
          postcode: customerInfo.postcode,
          country: 'IN',
        },
        payment_method: 'direct_payment',
        payment_method_title: 'Direct Payment to Distributors',
        status: 'processing', // Set order status to processing instead of pending
        meta_data: [
          {
            key: 'customer_name',
            value: customerInfo.name
          },
          {
            key: 'chemist_shop',
            value: user?.shop_name || 'Unknown Shop'
          },
          {
            key: 'order_type',
            value: 'chemist_order'
          }
        ]
      };

      const response = await api.createOrder(orderData);
      
      clearCart();
      toast.success('Order placed successfully! Your order is now being processed.');
      navigate('/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/cart')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Cart
            </Button>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-xl border border-primary/20">
                <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Checkout</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={customerInfo.name}
                      onChange={handleInputChange}
                      placeholder="Enter customer's full name"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={customerInfo.phone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                      disabled={loading}
                      className={user?.phone ? "bg-gray-50" : ""}
                    />
                    {user?.phone && (
                      <p className="text-xs text-green-600">
                        ✓ Pre-filled from your account
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    disabled={loading}
                    className={user?.email ? "bg-gray-50" : ""}
                  />
                  {user?.email && (
                    <p className="text-xs text-green-600">
                      ✓ Pre-filled from your account
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    name="address"
                    value={customerInfo.address}
                    onChange={handleInputChange}
                    placeholder="Enter delivery address"
                    disabled={loading}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={customerInfo.city}
                      onChange={handleInputChange}
                      placeholder="City"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      name="state"
                      value={customerInfo.state}
                      onChange={handleInputChange}
                      placeholder="State"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postcode">PIN Code *</Label>
                    <Input
                      id="postcode"
                      name="postcode"
                      value={customerInfo.postcode}
                      onChange={handleInputChange}
                      placeholder="PIN Code"
                      disabled={loading}
                      maxLength={6}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                    <div>
                      <h4 className="font-medium text-blue-900">Direct Payment to Distributors</h4>
                      <p className="text-sm text-blue-700">
                        Payment will be processed directly with the distributors. No online payment required.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded border"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                        {item.vendorName && (
                          <p className="text-xs text-muted-foreground">
                            Vendor: {item.vendorName}
                          </p>
                        )}
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm text-muted-foreground">
                            Qty: {item.quantity}
                          </span>
                          <span className="font-medium">
                            ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₹{getTotalPrice().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">₹{getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>

                {user?.shop_name && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Ordering as:</strong> {user.shop_name}
                    </p>
                  </div>
                )}

                <Button
                  onClick={handlePlaceOrder}
                  disabled={loading || !validateForm()}
                  className="w-full h-12 text-lg font-semibold"
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Placing Order...
                    </div>
                  ) : (
                    `Place Order - ₹${getTotalPrice().toFixed(2)}`
                  )}
                </Button>

                {!validateForm() && (
                  <Alert>
                    <AlertDescription>
                      Please fill in all required fields to continue.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
