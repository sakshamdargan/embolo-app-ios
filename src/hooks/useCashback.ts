import { useState, useEffect, useCallback } from 'react';
import cashbackService, { CashbackEntry, CashbackPreview, WalletDetails } from '@/services/cashbackService';
import { toast } from 'sonner';

export const useCashback = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getOrderCashback = useCallback(async (orderId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const cashback = await cashbackService.getOrderCashback(orderId);
      return cashback;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch cashback details';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCashbackPreview = useCallback(async (orderValue: number = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      const preview = await cashbackService.getCashbackPreview(orderValue);
      return preview;
    } catch (err: any) {
      let errorMessage = 'Failed to calculate cashback preview';
      
      if (err.response?.status === 404) {
        errorMessage = 'Cashback system not available. Please ensure the Embolo Cashback plugin is installed and activated.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error('Cashback preview error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const processCashback = useCallback(async (orderId: number, orderValue: number = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await cashbackService.getOrProcessCashback(orderId, orderValue);
      toast.success(`Cashback of ₹${result.amount.toFixed(2)} processed successfully!`);
      return result;
    } catch (err: any) {
      let errorMessage = 'Failed to process cashback';
      
      // Handle authentication errors specifically
      if (err.response?.status === 401 || err.response?.status === 403) {
        errorMessage = 'Authentication failed. Please log in again to process cashback.';
        console.error('Cashback authentication error:', err.response?.data);
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error('Cashback processing error:', err);
      
      // Don't show toast for auth errors - let the popup handle it
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        toast.error(errorMessage);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getOrderCashback,
    getCashbackPreview,
    processCashback,
  };
};

export const useWallet = () => {
  const [walletDetails, setWalletDetails] = useState<WalletDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const details = await cashbackService.getWalletDetails();
      setWalletDetails(details);
      return details;
    } catch (err: any) {
      let errorMessage = 'Failed to fetch wallet details';
      
      if (err.response?.status === 404) {
        errorMessage = 'Cashback system not available. Please ensure the Embolo Cashback plugin is installed and activated.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Wallet fetch error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshWallet = useCallback(() => {
    return fetchWalletDetails();
  }, [fetchWalletDetails]);

  useEffect(() => {
    fetchWalletDetails();
  }, [fetchWalletDetails]);

  return {
    walletDetails,
    loading,
    error,
    refreshWallet,
    fetchWalletDetails,
  };
};

export const useCashbackHistory = (initialLimit: number = 20) => {
  const [transactions, setTransactions] = useState<CashbackEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchHistory = useCallback(async (reset: boolean = false, status?: string) => {
    setLoading(true);
    setError(null);
    
    const currentOffset = reset ? 0 : offset;
    
    try {
      const response = await cashbackService.getCashbackHistory(initialLimit, currentOffset, status);
      
      if (reset) {
        setTransactions(response.data);
        setOffset(initialLimit);
      } else {
        setTransactions(prev => [...prev, ...response.data]);
        setOffset(prev => prev + initialLimit);
      }
      
      setHasMore(response.data.length === initialLimit);
      return response.data;
    } catch (err: any) {
      let errorMessage = 'Failed to fetch cashback history';
      
      if (err.response?.status === 404) {
        errorMessage = 'Cashback system not available. Please ensure the Embolo Cashback plugin is installed and activated.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Cashback history fetch error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [initialLimit, offset]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      return fetchHistory(false);
    }
  }, [fetchHistory, loading, hasMore]);

  const refresh = useCallback((status?: string) => {
    setOffset(0);
    return fetchHistory(true, status);
  }, [fetchHistory]);

  useEffect(() => {
    fetchHistory(true);
  }, []);

  return {
    transactions,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
};
