import { ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import ProductSkeleton from './ProductSkeleton';
import { Product } from '@/utils/api';

interface ProductSectionProps {
  title: string;
  products: Product[];
  loading?: boolean;
  onViewAll?: () => void;
}

const ProductSection = ({ title, products, loading = false, onViewAll }: ProductSectionProps) => {
  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-primary font-semibold text-sm hover:gap-2 transition-all"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default ProductSection;
