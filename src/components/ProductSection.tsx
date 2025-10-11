import { ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import ProductSkeleton from './ProductSkeleton';
import ProductCarousel from './ProductCarousel';
import type { Product } from '@/services/productService';

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  products: Product[];
  loading?: boolean;
  onViewAll?: () => void;
  layout?: 'grid' | 'carousel';
  columns?: 2 | 3 | 4;
}

const ProductSection = ({ 
  title, 
  subtitle,
  products, 
  loading = false, 
  onViewAll,
  layout = 'grid',
  columns = 2
}: ProductSectionProps) => {
  if (loading) {
    return (
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
        </div>
        <div className={`grid grid-cols-${columns} gap-4`}>
          {[...Array(4)].map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-primary font-semibold text-sm hover:gap-2 transition-all hover:underline"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {layout === 'carousel' ? (
        <ProductCarousel products={products} />
      ) : (
        <div className={`grid ${columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-4'} gap-4`}>
          {products.slice(0, columns * 2).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductSection;
