import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCartStore } from '@/store/useCartStore';
import { useAuth } from '@/contexts/AuthContext';
import { useAddresses } from '@/hooks/useAddresses';
import { api } from '@/utils/api';
import { toast } from 'sonner';
import addressService, { Address, AddressFormData } from '@/services/addressService';
import { 
  ShoppingCart, 
  MapPin, 
  User, 
  CreditCard, 
  Package,
  ArrowLeft,
  Loader2,
  Plus,
  Edit,
  Trash2
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
  const { addresses, loading: addressLoading, addAddress, updateAddress, deleteAddress } = useAddresses();
  const [loading, setLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postcode: ''
  });
  const [addressForm, setAddressForm] = useState<AddressFormData>({
    type: 'shipping',
    first_name: '',
    last_name: '',
    address_1: '',
    address_2: '',
    city: '',
    state: '',
    postcode: '',
    country: 'IN',
    phone: '',
    is_default: false
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
      
      // Pre-fill address form with user data
      setAddressForm(prev => ({
        ...prev,
        first_name: user.name?.split(' ')[0] || '',
        last_name: user.name?.split(' ').slice(1).join(' ') || '',
        phone: user.phone || ''
      }));
    }
  }, [items, navigate, user]);

  // Auto-select default shipping address
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultShipping = addresses.find(addr => addr.is_default_shipping);
      if (defaultShipping) {
        setSelectedAddressId(defaultShipping.id);
      } else {
        // Select first shipping address if no default
        const firstShipping = addresses.find(addr => addr.type === 'shipping');
        if (firstShipping) {
          setSelectedAddressId(firstShipping.id);
        }
      }
    }
  }, [addresses, selectedAddressId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!selectedAddressId && addresses.length > 0) {
      return false;
    }
    const required = ['name', 'phone', 'email'];
    return required.every(field => customerInfo[field as keyof CustomerInfo].trim() !== '');
  };

  const handleAddAddress = async () => {
    const result = await addAddress(addressForm);
    if (result) {
      setSelectedAddressId(result.id);
      setShowAddressForm(false);
      resetAddressForm();
    }
  };

  const handleUpdateAddress = async () => {
    if (!editingAddress) return;
    const result = await updateAddress(editingAddress.id, addressForm);
    if (result) {
      setEditingAddress(null);
      setShowAddressForm(false);
      resetAddressForm();
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    const success = await deleteAddress(addressId);
    if (success && selectedAddressId === addressId) {
      setSelectedAddressId(null);
    }
  };

  const resetAddressForm = () => {
    setAddressForm({
      type: 'shipping',
      first_name: user?.name?.split(' ')[0] || '',
      last_name: user?.name?.split(' ').slice(1).join(' ') || '',
      address_1: '',
      address_2: '',
      city: '',
      state: '',
      postcode: '',
      country: 'IN',
      phone: user?.phone || '',
      is_default: false
    });
  };

  const openEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      type: address.type,
      first_name: address.first_name,
      last_name: address.last_name,
      address_1: address.address_1,
      address_2: address.address_2 || '',
      city: address.city,
      state: address.state,
      postcode: address.postcode,
      country: address.country,
      phone: address.phone || '',
      is_default: address.is_default_shipping || address.is_default_billing
    });
    setShowAddressForm(true);
  };

  const getSelectedAddress = (): Address | null => {
    return addresses.find(addr => addr.id === selectedAddressId) || null;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      toast.error('Please complete all required fields');
      return;
    }

    const selectedAddress = getSelectedAddress();
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }

    try {
      setLoading(true);

      // Create order with customer details and selected address
      const orderData = {
        line_items: items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
        billing: {
          first_name: selectedAddress.first_name,
          last_name: selectedAddress.last_name,
          email: customerInfo.email,
          phone: selectedAddress.phone || customerInfo.phone,
          address_1: selectedAddress.address_1,
          address_2: selectedAddress.address_2 || '',
          city: selectedAddress.city,
          state: selectedAddress.state,
          postcode: selectedAddress.postcode,
          country: selectedAddress.country,
        },
        shipping: {
          first_name: selectedAddress.first_name,
          last_name: selectedAddress.last_name,
          address_1: selectedAddress.address_1,
          address_2: selectedAddress.address_2 || '',
          city: selectedAddress.city,
          state: selectedAddress.state,
          postcode: selectedAddress.postcode,
          country: selectedAddress.country,
        },
        payment_method: 'direct_payment',
        payment_method_title: 'Direct Payment to Distributors',
        status: 'processing',
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
      
      // Set the selected address as default billing address if it's not already
      if (selectedAddress && !selectedAddress.is_default_billing) {
        try {
          await addressService.setDefaultAddress(selectedAddress.id, 'billing');
        } catch (error) {
          console.warn('Failed to set default billing address:', error);
          // Don't fail the order for this
        }
      }
      
      clearCart();
      toast.success('Order placed successfully! Your order is now being processed.');
      navigate('/orders');
    } catch (error: any) {
      console.error('Error creating order:', error);
      
      // Check if order was actually created despite the error
      if (error.response?.status === 200 || error.response?.data?.success) {
        clearCart();
        toast.success('Order placed successfully! Your order is now being processed.');
        navigate('/orders');
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to place order. Please try again.';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderAddressForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            name="first_name"
            value={addressForm.first_name}
            onChange={handleAddressFormChange}
            placeholder="First name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            name="last_name"
            value={addressForm.last_name}
            onChange={handleAddressFormChange}
            placeholder="Last name"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="address_1">Address *</Label>
        <Input
          id="address_1"
          name="address_1"
          value={addressForm.address_1}
          onChange={handleAddressFormChange}
          placeholder="Street address"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="address_2">Address Line 2</Label>
        <Input
          id="address_2"
          name="address_2"
          value={addressForm.address_2}
          onChange={handleAddressFormChange}
          placeholder="Apartment, suite, etc. (optional)"
        />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            name="city"
            value={addressForm.city}
            onChange={handleAddressFormChange}
            placeholder="City"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State *</Label>
          <Input
            id="state"
            name="state"
            value={addressForm.state}
            onChange={handleAddressFormChange}
            placeholder="State"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postcode">PIN Code *</Label>
          <Input
            id="postcode"
            name="postcode"
            value={addressForm.postcode}
            onChange={handleAddressFormChange}
            placeholder="PIN Code"
            maxLength={6}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
          value={addressForm.phone}
          onChange={handleAddressFormChange}
          placeholder="Phone number"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_default"
          name="is_default"
          checked={addressForm.is_default}
          onChange={handleAddressFormChange}
          className="rounded"
        />
        <Label htmlFor="is_default">Set as default shipping address</Label>
      </div>
      
      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setShowAddressForm(false);
            setEditingAddress(null);
            resetAddressForm();
          }}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={editingAddress ? handleUpdateAddress : handleAddAddress}
          disabled={addressLoading}
          className="flex-1"
        >
          {addressLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          {editingAddress ? 'Update Address' : 'Add Address'}
        </Button>
      </div>
    </div>
  );

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
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Delivery Address
                  </div>
                  <Dialog open={showAddressForm} onOpenChange={setShowAddressForm}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingAddress(null);
                          resetAddressForm();
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingAddress ? 'Edit Address' : 'Add New Address'}
                        </DialogTitle>
                      </DialogHeader>
                      {renderAddressForm()}
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {addressLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">No saved addresses found</p>
                    <Button
                      onClick={() => {
                        setEditingAddress(null);
                        resetAddressForm();
                        setShowAddressForm(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Address
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.filter(addr => addr.type === 'shipping').map((address) => (
                      <div
                        key={address.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedAddressId === address.id
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedAddressId(address.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-4 h-4 rounded-full border-2 ${
                                selectedAddressId === address.id
                                  ? 'border-primary bg-primary'
                                  : 'border-gray-300'
                              }`}>
                                {selectedAddressId === address.id && (
                                  <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                                )}
                              </div>
                              <span className="font-medium">
                                {address.first_name} {address.last_name}
                              </span>
                              {address.is_default_shipping && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 ml-6">
                              {addressService.formatAddress(address)}
                            </p>
                            {address.phone && (
                              <p className="text-sm text-gray-500 ml-6">
                                Phone: {address.phone}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditAddress(address);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAddress(address.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                  disabled={loading || !validateForm() || !selectedAddressId}
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

                {(!validateForm() || !selectedAddressId) && (
                  <Alert>
                    <AlertDescription>
                      {!validateForm() 
                        ? "Please fill in all required customer information."
                        : !selectedAddressId 
                        ? "Please select a delivery address."
                        : "Please complete all required fields to continue."
                      }
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
