import { useEffect, useState } from 'react';
import HeroBanner from '@/components/HeroBanner';
import ProductSection from '@/components/ProductSection';
import { useProductStore } from '@/store/useProductStore';
import { api, Product } from '@/utils/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';

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
      const data = await api.getProducts(1, 40);
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
      setCategories(data.slice(0, 5));
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const getProductsByCategory = (categoryId: number): Product[] => {
    return products.filter(product => 
      product.categories?.some(cat => cat.id === categoryId)
    );
  };

  const getFeaturedProducts = (): Product[] => {
    return products.slice(0, 8);
  };

  const getTopRatedProducts = (): Product[] => {
    return products.filter(p => p.price).slice(8, 16);
  };

  const getBestSellingProducts = (): Product[] => {
    return products.filter(p => p.stock_status === 'instock').slice(16, 24);
  };

  const handleViewAll = () => {
    navigate('/search');
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Hero Banner with spacing below navbar */}
        <div className="pt-2">
          <HeroBanner />
        </div>

        <Separator className="my-8" />

        {/* Featured Products - Carousel */}
        <ProductSection
          title="Featured Products"
          subtitle="Handpicked products just for you"
          products={getFeaturedProducts()}
          loading={loading}
          onViewAll={handleViewAll}
          layout="carousel"
        />

        <Separator className="my-8" />

        {/* Top Rated Products - Grid */}
        <ProductSection
          title="Top Rated"
          subtitle="Customer favorites with best reviews"
          products={getTopRatedProducts()}
          loading={loading}
          onViewAll={handleViewAll}
          layout="grid"
          columns={2}
        />

        {/* Best Selling Products - Carousel */}
        <ProductSection
          title="Best Sellers"
          subtitle="Most popular items this month"
          products={getBestSellingProducts()}
          loading={loading}
          onViewAll={handleViewAll}
          layout="carousel"
        />

        <Separator className="my-8" />

        {/* Category-based Sections */}
        {!loading && categories.slice(0, 3).map((category, index) => {
          const categoryProducts = getProductsByCategory(category.id);
          if (categoryProducts.length === 0) return null;
          
          return (
            <div key={category.id}>
              <ProductSection
                title={category.name}
                subtitle={`Shop from ${category.count} products`}
                products={categoryProducts}
                onViewAll={handleViewAll}
                layout={index % 2 === 0 ? 'carousel' : 'grid'}
                columns={2}
              />
              {index < 2 && <Separator className="my-8" />}
            </div>
          );
        })}

        {/* New Arrivals - Last section */}
        {!loading && products.length > 24 && (
          <>
            <Separator className="my-8" />
            <ProductSection
              title="New Arrivals"
              subtitle="Latest additions to our collection"
              products={products.slice(24, 32)}
              onViewAll={handleViewAll}
              layout="grid"
              columns={2}
            />
          </>
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
