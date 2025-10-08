import { useState, useEffect, useCallback, useMemo } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import productService, { Product, ProductsParams, Category } from '../services/productService';

// Hook for paginated products with infinite scroll
export const useInfiniteProducts = (params: Omit<ProductsParams, 'page'> = {}) => {
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
    queryKey: ['products', 'infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await productService.getProducts({
        ...params,
        page: pageParam,
        per_page: params.per_page || 20
      });
      return response;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.has_more ? lastPage.pagination.current_page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Flatten all products from all pages
  const products = useMemo(() => {
    return data?.pages.flatMap(page => page.data) || [];
  }, [data]);

  // Total count from the first page
  const totalCount = data?.pages[0]?.pagination.total_items || 0;

  return {
    products,
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

// Hook for regular paginated products
export const useProducts = (params: ProductsParams = {}) => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['products', params],
    queryFn: () => productService.getProducts(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    products: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError,
    error,
    refetch
  };
};

// Hook for single product
export const useProduct = (productId: number | null) => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productService.getProduct(productId!),
    enabled: !!productId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  return {
    product: data?.data,
    isLoading,
    isError,
    error,
    refetch
  };
};

// Hook for product search with debouncing
export const useProductSearch = (searchQuery: string, debounceMs: number = 500) => {
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchQuery, debounceMs]);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['products', 'search', debouncedQuery],
    queryFn: () => productService.searchProducts({ q: debouncedQuery, per_page: 20 }),
    enabled: debouncedQuery.length >= 2, // Only search if query is at least 2 characters
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    products: data?.data || [],
    pagination: data?.pagination,
    isLoading: isLoading && debouncedQuery.length >= 2,
    isError,
    error,
    refetch,
    searchQuery: debouncedQuery
  };
};

// Hook for categories
export const useCategories = () => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productService.getCategories({ per_page: 100 }),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  return {
    categories: data?.data || [],
    isLoading,
    isError,
    error,
    refetch
  };
};

// Hook for featured products
export const useFeaturedProducts = (limit: number = 10) => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['products', 'featured', limit],
    queryFn: () => productService.getFeaturedProducts(limit),
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  return {
    products: data?.data || [],
    isLoading,
    isError,
    error,
    refetch
  };
};

// Hook for products by category with infinite scroll
export const useProductsByCategory = (categoryId: number | null, params: Omit<ProductsParams, 'category' | 'page'> = {}) => {
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
    queryKey: ['products', 'category', categoryId, params],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await productService.getProductsByCategory(categoryId!, {
        ...params,
        page: pageParam,
        per_page: params.per_page || 20
      });
      return response;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.has_more ? lastPage.pagination.current_page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const products = useMemo(() => {
    return data?.pages.flatMap(page => page.data) || [];
  }, [data]);

  const totalCount = data?.pages[0]?.pagination.total_items || 0;

  return {
    products,
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

// Hook for related products
export const useRelatedProducts = (productId: number | null) => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['products', 'related', productId],
    queryFn: () => productService.getRelatedProducts(productId!),
    enabled: !!productId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  return {
    products: data || [],
    isLoading,
    isError,
    error,
    refetch
  };
};

// Hook for product availability check
export const useProductAvailability = (productId: number | null, quantity: number = 1) => {
  const {
    data: isAvailable,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['product', 'availability', productId, quantity],
    queryFn: () => productService.checkProductAvailability(productId!, quantity),
    enabled: !!productId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    isAvailable: isAvailable || false,
    isLoading,
    isError,
    error,
    refetch
  };
};

// Custom hook for managing product filters
export const useProductFilters = () => {
  const [filters, setFilters] = useState<ProductsParams>({
    page: 1,
    per_page: 20,
    orderby: 'date',
    order: 'DESC'
  });

  const updateFilter = useCallback((key: keyof ProductsParams, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1 // Reset page when other filters change
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      page: 1,
      per_page: 20,
      orderby: 'date',
      order: 'DESC'
    });
  }, []);

  return {
    filters,
    updateFilter,
    resetFilters,
    setFilters
  };
};

// Hook for prefetching products (for performance optimization)
export const usePrefetchProducts = () => {
  const queryClient = useQueryClient();

  const prefetchProducts = useCallback(async (params: ProductsParams) => {
    await queryClient.prefetchQuery({
      queryKey: ['products', params],
      queryFn: () => productService.getProducts(params),
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);

  const prefetchProduct = useCallback(async (productId: number) => {
    await queryClient.prefetchQuery({
      queryKey: ['product', productId],
      queryFn: () => productService.getProduct(productId),
      staleTime: 10 * 60 * 1000,
    });
  }, [queryClient]);

  const prefetchCategory = useCallback(async (categoryId: number, params: Omit<ProductsParams, 'category'> = {}) => {
    await queryClient.prefetchInfiniteQuery({
      queryKey: ['products', 'category', categoryId, params],
      queryFn: async ({ pageParam = 1 }) => {
        return await productService.getProductsByCategory(categoryId, {
          ...params,
          page: pageParam,
          per_page: params.per_page || 20
        });
      },
      initialPageParam: 1,
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);

  return {
    prefetchProducts,
    prefetchProduct,
    prefetchCategory
  };
};
