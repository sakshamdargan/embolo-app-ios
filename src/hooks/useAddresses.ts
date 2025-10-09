import { useState, useEffect } from 'react';
import addressService, { Address, AddressFormData } from '@/services/addressService';
import { toast } from 'sonner';

export const useAddresses = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch addresses
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await addressService.getAddresses();
      setAddresses(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch addresses';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Add new address
  const addAddress = async (addressData: AddressFormData): Promise<Address | null> => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate address data
      const validationErrors = addressService.validateAddress(addressData);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }
      
      const newAddress = await addressService.addAddress(addressData);
      setAddresses(prev => [...prev, newAddress]);
      toast.success('Address added successfully');
      return newAddress;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to add address';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update existing address
  const updateAddress = async (id: string, addressData: Partial<AddressFormData>): Promise<Address | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedAddress = await addressService.updateAddress(id, addressData);
      setAddresses(prev => prev.map(addr => addr.id === id ? updatedAddress : addr));
      toast.success('Address updated successfully');
      return updatedAddress;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update address';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete address
  const deleteAddress = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await addressService.deleteAddress(id);
      setAddresses(prev => prev.filter(addr => addr.id !== id));
      toast.success('Address deleted successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete address';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Set default address
  const setDefaultAddress = async (id: string, type: 'billing' | 'shipping'): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await addressService.setDefaultAddress(id, type);
      
      // Update local state
      setAddresses(prev => prev.map(addr => ({
        ...addr,
        is_default_billing: type === 'billing' ? addr.id === id : addr.is_default_billing,
        is_default_shipping: type === 'shipping' ? addr.id === id : addr.is_default_shipping
      })));
      
      toast.success(`Default ${type} address updated`);
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to set default address';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get default address by type
  const getDefaultAddress = (type: 'billing' | 'shipping'): Address | null => {
    return addressService.getDefaultAddress(addresses, type);
  };

  // Get shipping addresses only
  const getShippingAddresses = (): Address[] => {
    return addresses.filter(addr => addr.type === 'shipping');
  };

  // Get billing addresses only
  const getBillingAddresses = (): Address[] => {
    return addresses.filter(addr => addr.type === 'billing');
  };

  // Load addresses on mount
  useEffect(() => {
    fetchAddresses();
  }, []);

  return {
    addresses,
    loading,
    error,
    fetchAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getDefaultAddress,
    getShippingAddresses,
    getBillingAddresses,
  };
};
