import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingCart, MapPin, Package, Loader2, Edit, ArrowLeft } from 'lucide-react';
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


const Checkout = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCartStore();
  const { user } = useAuth();
  const { addresses, loading: addressLoading, addAddress, updateAddress, deleteAddress } = useAddresses();
  const [loading, setLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
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
    // Pre-fill address form with user data
    if (user) {
      setAddressForm(prev => ({
        ...prev,
        first_name: user.name?.split(' ')[0] || '',
        last_name: user.name?.split(' ').slice(1).join(' ') || '',
        phone: user.phone || ''
      }));
    }
  }, [user]);

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


  const handleAddressFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    return selectedAddressId !== null;
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
      toast.error('Please select a delivery address');
      return;
    }

    const selectedAddress = getSelectedAddress();
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }

    try {
      setLoading(true);

      // Create order with selected address - backend will handle customer info automatically
      const orderData = {
        line_items: items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
        billing: {
          first_name: selectedAddress.first_name,
          last_name: selectedAddress.last_name,
          email: user?.email || '',
          phone: selectedAddress.phone || user?.phone || '',
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
            value: `${selectedAddress.first_name} ${selectedAddress.last_name}`
          },
          {
            key: 'chemist_shop',
            value: user?.shop_name || 'Unknown Shop'
          },
          {
            key: 'order_type',
            value: 'chemist_order'
          }
        ],
        device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
      };

      const response = await api.createOrder(orderData);
      
      // Backend returns {success: true, data: {...}, message: '...'}
      // Check for success flag in the response
      if (response?.success === true) {
        // Set the selected address as default billing address if it's not already
        if (selectedAddress && !selectedAddress.is_default_billing) {
          try {
            await addressService.setDefaultAddress(selectedAddress.id, 'billing');
          } catch (error) {
            // Silent fail for address update
          }
        }
        
        // Trigger cashback popup with order ID
        const orderId = response.data?.id;
        if (orderId) {
          const totalPrice = getTotalPrice();
          console.log('Order placed successfully, triggering cashback popup with order ID:', orderId, 'and value:', totalPrice);
          
          // Try multiple methods to trigger cashback popup
          // Method 1: Use global ref
          const globalRef = (window as any).globalCashbackRef;
          if (globalRef?.current) {
            console.log('Using globalCashbackRef.current.triggerPopup');
            globalRef.current.triggerPopup(orderId, totalPrice);
          }
          // Method 2: Use window function
          else if ((window as any).triggerCashbackPopup) {
            console.log('Using window.triggerCashbackPopup');
            (window as any).triggerCashbackPopup(orderId, totalPrice);
          }
          // Method 3: Fallback to custom event
          else {
            console.log('Using custom event fallback');
            window.dispatchEvent(new CustomEvent('orderPlaced', { 
              detail: { orderId, orderValue: totalPrice } 
            }));
          }
        }
        
        clearCart();
        toast.success('Order placed successfully! Your order is now being processed.');
        
        // Delay navigation to allow cashback popup to show
        setTimeout(() => {
          navigate('/orders');
        }, 6000);
      } else {
        throw new Error(response?.message || 'Failed to create order');
      }
    } catch (error: any) {
      
      // Check if the error response actually contains a successful order
      const responseData = error.response?.data;
      const isActuallySuccess = 
        error.response?.status === 200 || 
        responseData?.success === true ||
        (responseData?.data && responseData.data.id);
      
      if (isActuallySuccess) {
        // Trigger cashback popup with order ID
        const orderId = responseData?.data?.id;
        if (orderId) {
          console.log('Order placed successfully (error path), triggering cashback popup with order ID:', orderId, 'and value:', getTotalPrice());
          
          // Try to trigger cashback popup
          if ((window as any).triggerCashbackPopup) {
            console.log('Using window.triggerCashbackPopup (error path)');
            (window as any).triggerCashbackPopup(orderId);
          } else {
            console.log('Using custom event fallback (error path)');
            // Fallback: dispatch custom event
            window.dispatchEvent(new CustomEvent('orderPlaced', { 
              detail: { orderId, orderValue: getTotalPrice() } 
            }));
          }
        }
        
        clearCart();
        toast.success('Order placed successfully! Your order is now being processed.');
        
        // Delay navigation to allow cashback popup to show
        setTimeout(() => {
          navigate('/orders');
        }, 6000);
      } else {
        const errorMessage = responseData?.message || error.message || 'Failed to place order. Please try again.';
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
          <Button onClick={() => navigate('/')} className="px-8">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-1 text-xs px-2 py-1 h-8"
            >
              <ArrowLeft className="w-3 h-3" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
                <ShoppingCart className="w-4 h-4 text-primary" />
              </div>
              <h1 className="text-lg font-bold">Checkout</h1>
            </div>
            <div className="w-12"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Cart Items & Address */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Your Items
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCart}
                    className="gap-2 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[40vh] overflow-y-auto space-y-4">
                  {items.map((item) => (
                    <Card 
                      key={item.id} 
                      className="rounded-lg border border-gray-200 shadow-sm"
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4 items-start">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border border-gray-200"
                          />
                          
                          <div className="flex-1 min-w-0 space-y-2">
                            <h3 className="font-semibold text-sm line-clamp-2">{item.name}</h3>
                            {item.vendorName && (
                              <p className="text-xs text-muted-foreground">Sold by: {item.vendorName}</p>
                            )}
                            <p className="text-lg font-bold text-primary">
                              ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                              <span className="text-sm text-muted-foreground font-normal ml-2">
                                (₹{parseFloat(item.price).toFixed(2)} each)
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
                                  <Minus className="w-3 h-3" />
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
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeItem(item.id)}
                                className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                              >
                                <Trash2 className="w-3 h-3" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between font-bold text-2xl">
                    <span>Total Amount</span>
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

                {!validateForm() && (
                  <Alert>
                    <AlertDescription>
                      Please select a delivery address to continue.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Debug: Test Cashback Popup Button */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 mb-2">Debug: Test Cashback Popup</p>
                <button
                  onClick={() => {
                    console.log('Manual test button clicked');
                    // Method 1: Try global ref first
                    const globalRef = (window as any).globalCashbackRef;
                    if (globalRef?.current) {
                      console.log('Calling globalCashbackRef.current.triggerPopup');
                      globalRef.current.triggerPopup(12345);
                    }
                    // Method 2: Try window function
                    else if ((window as any).triggerCashbackPopup) {
                      console.log('Calling window.triggerCashbackPopup with test data');
                      (window as any).triggerCashbackPopup(12345);
                    }
                    // Method 3: Fallback to event
                    else {
                      console.log('window.triggerCashbackPopup not available, dispatching event');
                      window.dispatchEvent(new CustomEvent('orderPlaced', { 
                        detail: { orderId: 12345, orderValue: 1000 } 
                      }));
                    }
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Test Cashback Popup
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Place Order Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 shadow-lg z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-6xl mx-auto">
            <Button
              onClick={handlePlaceOrder}
              disabled={loading || !validateForm()}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all rounded-xl"
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
