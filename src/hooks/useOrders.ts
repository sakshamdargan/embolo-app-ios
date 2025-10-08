import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import orderService, { Order, CreateOrderData, OrdersParams } from '../services/orderService';
import { toast } from 'sonner';

// Hook for paginated orders
export const useOrders = (params: OrdersParams = {}) => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['orders', params],
    queryFn: () => orderService.getOrders(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    orders: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError,
    error,
    refetch
  };
};

// Hook for infinite scroll orders
export const useInfiniteOrders = (params: Omit<OrdersParams, 'page'> = {}) => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['orders', 'infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await orderService.getOrders({
        ...params,
        page: pageParam,
        per_page: params.per_page || 10
      });
      return response;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.has_more ? lastPage.pagination.current_page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Flatten all orders from all pages
  const orders = useMemo(() => {
    return data?.pages.flatMap(page => page.data) || [];
  }, [data]);

  const totalCount = data?.pages[0]?.pagination.total_items || 0;

  return {
    orders,
    totalCount,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch
  };
};

// Hook for single order
export const useOrder = (orderId: number | null) => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrder(orderId!),
    enabled: !!orderId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    order: data?.data,
    isLoading,
    isError,
    error,
    refetch
  };
};

// Hook for creating orders
export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (orderData: CreateOrderData) => orderService.createOrder(orderData),
    onSuccess: (response) => {
      // Invalidate and refetch orders
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      
      toast.success('Order created successfully!', {
        description: `Order #${response.data.order_number} has been placed.`
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to create order', {
        description: error.message
      });
    }
  });

  return {
    createOrder: mutation.mutate,
    createOrderAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data
  };
};

// Hook for updating order status
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) => 
      orderService.updateOrderStatus(orderId, status),
    onSuccess: (response, variables) => {
      // Update the specific order in cache
      queryClient.setQueryData(['order', variables.orderId], response);
      
      // Invalidate orders list to refresh
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      
      toast.success('Order status updated', {
        description: `Order status changed to ${response.data.status_label}`
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to update order status', {
        description: error.message
      });
    }
  });

  return {
    updateStatus: mutation.mutate,
    updateStatusAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess
  };
};

// Hook for cancelling orders
export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (orderId: number) => orderService.cancelOrder(orderId),
    onSuccess: (response, orderId) => {
      // Update the specific order in cache
      queryClient.setQueryData(['order', orderId], response);
      
      // Invalidate orders list to refresh
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      
      toast.success('Order cancelled', {
        description: `Order #${response.data.order_number} has been cancelled.`
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to cancel order', {
        description: error.message
      });
    }
  });

  return {
    cancelOrder: mutation.mutate,
    cancelOrderAsync: mutation.mutateAsync,
    isCancelling: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess
  };
};

// Hook for recent orders
export const useRecentOrders = (limit: number = 5) => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['orders', 'recent', limit],
    queryFn: () => orderService.getRecentOrders(limit),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    orders: data || [],
    isLoading,
    isError,
    error,
    refetch
  };
};

// Hook for order metrics/statistics
export const useOrderMetrics = () => {
  const { orders, isLoading } = useOrders({ per_page: 100 }); // Get more orders for better metrics

  const metrics = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        statusBreakdown: {}
      };
    }

    return orderService.calculateOrderMetrics(orders);
  }, [orders]);

  return {
    metrics,
    isLoading
  };
};

// Hook for order filters
export const useOrderFilters = () => {
  const [filters, setFilters] = useState<OrdersParams>({
    page: 1,
    per_page: 10
  });

  const updateFilter = useCallback((key: keyof OrdersParams, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1 // Reset page when other filters change
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      page: 1,
      per_page: 10
    });
  }, []);

  return {
    filters,
    updateFilter,
    resetFilters,
    setFilters
  };
};

// Hook for order search
export const useOrderSearch = (searchQuery: string) => {
  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['orders', 'search', searchQuery],
    queryFn: () => orderService.searchOrderByNumber(searchQuery),
    enabled: searchQuery.length >= 3, // Only search if query is at least 3 characters
    staleTime: 30 * 1000, // 30 seconds for search results
    gcTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    order,
    isLoading: isLoading && searchQuery.length >= 3,
    isError,
    error,
    refetch,
    searchQuery
  };
};

// Hook for order validation
export const useOrderValidation = () => {
  const validateOrder = useCallback((orderData: CreateOrderData) => {
    return orderService.validateOrderData(orderData);
  }, []);

  return {
    validateOrder
  };
};

// Hook for order status management
export const useOrderStatusManager = (order: Order | null) => {
  const { updateStatus, isUpdating } = useUpdateOrderStatus();
  const { cancelOrder, isCancelling } = useCancelOrder();

  const canCancel = useMemo(() => {
    return order ? orderService.canCancelOrder(order) : false;
  }, [order]);

  const statusColor = useMemo(() => {
    return order ? orderService.getOrderStatusColor(order.status) : '';
  }, [order]);

  const statusIcon = useMemo(() => {
    return order ? orderService.getOrderStatusIcon(order.status) : '';
  }, [order]);

  const handleCancel = useCallback(() => {
    if (order && canCancel) {
      cancelOrder(order.id);
    }
  }, [order, canCancel, cancelOrder]);

  return {
    canCancel,
    statusColor,
    statusIcon,
    updateStatus: (status: string) => order && updateStatus({ orderId: order.id, status }),
    handleCancel,
    isUpdating: isUpdating || isCancelling
  };
};

// Hook for prefetching orders
export const usePrefetchOrders = () => {
  const queryClient = useQueryClient();

  const prefetchOrders = useCallback(async (params: OrdersParams = {}) => {
    await queryClient.prefetchQuery({
      queryKey: ['orders', params],
      queryFn: () => orderService.getOrders(params),
      staleTime: 2 * 60 * 1000,
    });
  }, [queryClient]);

  const prefetchOrder = useCallback(async (orderId: number) => {
    await queryClient.prefetchQuery({
      queryKey: ['order', orderId],
      queryFn: () => orderService.getOrder(orderId),
      staleTime: 1 * 60 * 1000,
    });
  }, [queryClient]);

  return {
    prefetchOrders,
    prefetchOrder
  };
};
