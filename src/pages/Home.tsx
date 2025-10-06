import { useEffect, useState } from 'react';
import SearchBarSection from '@/components/SearchBarSection';
import HeroBanner from '@/components/HeroBanner';
import ProductSection from '@/components/ProductSection';
import { useProductStore } from '@/store/useProductStore';
import { api, Product } from '@/utils/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { products, setProducts, loading, setLoading } = useProductStore();
  const [categories, setCategories] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts(1, 20);
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data.slice(0, 3)); // Get top 3 categories
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const getProductsByCategory = (categoryId: number): Product[] => {
    return products.filter(product => 
      product.categories?.some(cat => cat.id === categoryId)
    );
  };

  const handleViewAll = () => {
    navigate('/search');
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <main className="container mx-auto px-4 py-6">
        {/* Hero Banner */}
        <HeroBanner />

        {/* Featured Products */}
        <ProductSection
          title="Featured Products"
          products={products.slice(0, 4)}
          loading={loading}
          onViewAll={handleViewAll}
        />

        {/* Category-based Sections */}
        {!loading && categories.map((category) => {
          const categoryProducts = getProductsByCategory(category.id);
          if (categoryProducts.length === 0) return null;
          
          return (
            <ProductSection
              key={category.id}
              title={category.name}
              products={categoryProducts}
              onViewAll={handleViewAll}
            />
          );
        })}

        {/* All Products Fallback */}
        {!loading && categories.length === 0 && products.length > 4 && (
          <ProductSection
            title="All Products"
            products={products.slice(4)}
            onViewAll={handleViewAll}
          />
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
