import React, { useCallback, useEffect, useRef } from 'react';
import { useInfiniteProducts } from '../hooks/useProducts';
import { Product } from '../services/productService';
import ProductCard from './ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '../hooks/use-mobile';

interface VirtualProductGridProps {
  searchQuery?: string;
  categoryId?: number;
  orderBy?: 'date' | 'title' | 'price' | 'popularity' | 'rating';
  order?: 'ASC' | 'DESC';
  itemsPerPage?: number;
}

const InfiniteProductGrid: React.FC<VirtualProductGridProps> = ({
  searchQuery,
  categoryId,
  orderBy = 'date',
  order = 'DESC',
  itemsPerPage = 20
}) => {
  const isMobile = useIsMobile();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    products,
    totalCount,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useInfiniteProducts({
    search: searchQuery,
    category: categoryId,
    orderby: orderBy,
    order,
    per_page: itemsPerPage
  });

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isError) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertDescription>
          {error?.message || 'Failed to load products. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading && products.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
        {Array.from({ length: itemsPerPage }).map((_, index) => (
          <ProductSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (products.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-lg font-semibold mb-2">No products found</h3>
        <p className="text-gray-600">
          {searchQuery 
            ? `No products match "${searchQuery}"`
            : 'No products available in this category'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Products Grid */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Load More Trigger */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {isFetchingNextPage ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm text-gray-600">Loading more products...</span>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              className="px-8"
            >
              Load More Products
            </Button>
          )}
        </div>
      )}

      {/* End of results */}
      {!hasNextPage && products.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>You've reached the end of the catalog</p>
          <p className="text-sm">Showing {products.length} products</p>
        </div>
      )}
    </div>
  );
};

// Product skeleton component
const ProductSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm border p-4 space-y-3">
    <Skeleton className="h-48 w-full rounded-md" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-8 w-16 rounded" />
      </div>
    </div>
  </div>
);

export default InfiniteProductGrid;
