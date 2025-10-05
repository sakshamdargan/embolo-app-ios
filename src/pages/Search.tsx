import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Fuse from 'fuse.js';
import SearchBar from '@/components/SearchBar';
import ProductCard from '@/components/ProductCard';
import ProductSkeleton from '@/components/ProductSkeleton';
import { api, Product } from '@/utils/api';
import { toast } from 'sonner';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllProducts();
  }, []);

  useEffect(() => {
    if (allProducts.length > 0) {
      performSearch(searchQuery);
    }
  }, [searchQuery, allProducts]);

  const loadAllProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts(1, 100);
      setAllProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const performSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredProducts([]);
      return;
    }

    const fuse = new Fuse(allProducts, {
      keys: ['name', 'description', 'short_description'],
      threshold: 0.4,
      includeScore: true,
    });

    const results = fuse.search(query);
    setFilteredProducts(results.map((result) => result.item));
    setSearchParams({ q: query });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      {/* Search Bar */}
      <div className="sticky top-16 z-30 bg-card border-b border-border">
        <div className="gradient-primary p-4">
          <SearchBar
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search for products..."
          />
        </div>
      </div>

      {/* Search Results */}
      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : !searchQuery.trim() ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Start typing to search for products
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No results found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Try different keywords
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-4">
              {filteredProducts.length} results for "{searchQuery}"
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Search;
