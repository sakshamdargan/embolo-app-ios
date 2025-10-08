import { useEffect, useState } from 'react';
import HeroBanner from '@/components/HeroBanner';
import ProductSection from '@/components/ProductSection';
import { useProductStore } from '@/store/useProductStore';
import { useVendorStore } from '@/store/useVendorStore';
import { api, Product } from '@/utils/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';

const Home = () => {
  const { products, setProducts, loading, setLoading } = useProductStore();
  const { selectedVendorIds, allVendorsSelected } = useVendorStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  // Reload products when vendor selection changes - use server-side filtering
  useEffect(() => {
    loadProducts();
  }, [selectedVendorIds, allVendorsSelected]);

  // No need for client-side filtering since we're doing server-side filtering
  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      // Use server-side vendor filtering
      const vendorIds = allVendorsSelected ? undefined : selectedVendorIds;
      const data = await api.getProducts(1, 40, vendorIds);
      setProducts(data);
      // Since we're doing server-side filtering, set filtered products same as products
      setFilteredProducts(data);
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
    return filteredProducts.filter(product => 
      product.categories?.some(cat => cat.id === categoryId)
    );
  };

  const getFeaturedProducts = (): Product[] => {
    return filteredProducts.slice(0, 8);
  };

  const getTopRatedProducts = (): Product[] => {
    return filteredProducts.filter(p => p.price).slice(8, 16);
  };

  const getBestSellingProducts = (): Product[] => {
    return filteredProducts.filter(p => p.stock_status === 'instock').slice(16, 24);
  };

  const handleViewAll = () => {
    navigate('/search');
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Hero Banner */}
        <HeroBanner />

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

        {/* Trending Now - Grid */}
        <ProductSection
          title="Trending Now"
          subtitle="What's popular right now"
          products={filteredProducts.slice(0, 6)}
          loading={loading}
          layout="grid"
          columns={2}
        />

        <Separator className="my-8" />

        {/* Daily Essentials - Carousel */}
        <ProductSection
          title="Daily Essentials"
          subtitle="Must-have items for everyday use"
          products={filteredProducts.slice(8, 16)}
          loading={loading}
          layout="carousel"
        />

        <Separator className="my-8" />

        {/* Special Offers - Grid */}
        <ProductSection
          title="Special Offers"
          subtitle="Limited time deals and discounts"
          products={filteredProducts.slice(16, 22)}
          loading={loading}
          layout="grid"
          columns={2}
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

        {/* New Arrivals - Grid */}
        {!loading && filteredProducts.length > 24 && (
          <>
            <Separator className="my-8" />
            <ProductSection
              title="New Arrivals"
              subtitle="Latest additions to our collection"
              products={filteredProducts.slice(24, 32)}
              layout="carousel"
            />
          </>
        )}

        {/* All Products - Table View */}
        {!loading && filteredProducts.length > 32 && (
          <>
            <Separator className="my-8" />
            <ProductSection
              title="All Products"
              subtitle="Browse our complete collection"
              products={filteredProducts.slice(0, 40)}
              layout="grid"
              columns={2}
            />
          </>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
