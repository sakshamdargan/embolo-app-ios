import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/useCartStore';
import { api, Product } from '@/utils/api';
import { toast } from 'sonner';
import Fuse from 'fuse.js';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSearch?: () => void;
}

const SearchBar = ({ value, onChange, placeholder = "Search products...", onSearch }: SearchBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore((state) => state.addItem);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts(1, 100);
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    onChange(query);
    
    if (!query.trim()) {
      setFilteredProducts([]);
      setIsOpen(false);
      return;
    }

    // Perform fuzzy search
    const fuse = new Fuse(products, {
      keys: [
        { name: 'name', weight: 0.7 },
        { name: 'short_description', weight: 0.2 },
        { name: 'description', weight: 0.1 },
      ],
      threshold: 0.3,
      distance: 200,
      minMatchCharLength: 2,
      ignoreLocation: true,
      includeScore: true,
    });

    const results = fuse.search(query);
    setFilteredProducts(results.map((result) => result.item).slice(0, 8)); // Limit to 8 results
    setIsOpen(true);
  };

  const handleAddToCart = (product: Product) => {
    const price = product.sale_price || product.regular_price || product.price;
    const imageUrl = product.images?.[0]?.src || '/placeholder.svg';
    const stockQuantity = product.stock_quantity;
    const inStock = product.stock_status === 'instock';

    if (!inStock) {
      toast.error('Product is out of stock');
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: price,
      quantity: 1,
      image: imageUrl,
      stock_quantity: stockQuantity,
      vendorName: product.store?.name || 'Unknown Vendor',
    });

    toast.success(`Added ${product.name} to cart`);
    setIsOpen(false);
    onChange('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch();
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
        <Input
          type="text"
          value={value}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => value.trim() && setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10 h-12 rounded-lg border-gray-300 bg-gray-100 text-gray-900 placeholder:text-gray-500"
        />
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-0 bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            value.trim() ? (
              <div className="p-4 text-center text-muted-foreground">
                No products found
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                Start typing to search
              </div>
            )
          ) : (
            <div className="py-2">
              {filteredProducts.map((product) => {
                const price = product.sale_price || product.regular_price || product.price;
                const imageUrl = product.images?.[0]?.src || '/placeholder.svg';
                const inStock = product.stock_status === 'instock';
                const [qty, setQty] = [1, (n:number)=>n]; // placeholder to satisfy TS in map scope

                return (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                  >
                    {/* Product Image */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {product.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {product.store?.name || 'Vendor'}
                      </p>
                      <p className="text-xs font-medium text-primary">
                        {price && parseFloat(price) > 0 ? `$${parseFloat(price).toFixed(2)}` : 'Price on request'}
                      </p>
                    </div>

                    {/* Quantity Selector + Add */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center border border-border rounded-md overflow-hidden">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            const el = (e.currentTarget.nextSibling as HTMLElement);
                            const current = Number(el?.dataset.qty || '1');
                            const next = Math.max(1, current - 1);
                            if (el) el.dataset.qty = String(next);
                            if (el) el.innerText = String(next);
                          }}
                          className="h-8 w-8 text-sm hover:bg-muted"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span data-qty="1" className="px-2 min-w-[1.5rem] text-center text-sm">1</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            const el = (e.currentTarget.previousSibling as HTMLElement);
                            const current = Number(el?.dataset.qty || '1');
                            const next = current + 1;
                            if (el) el.dataset.qty = String(next);
                            if (el) el.innerText = String(next);
                          }}
                          className="h-8 w-8 text-sm hover:bg-muted"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          const qtyEl = (e.currentTarget.previousSibling as HTMLElement)?.querySelector('[data-qty]') as HTMLElement | null;
                          const qtyVal = qtyEl ? Number(qtyEl.dataset.qty || '1') : 1;
                          // Temporarily call handleAddToCart multiple times to respect qty
                          for (let i = 0; i < Math.max(1, qtyVal); i++) handleAddToCart(product);
                        }}
                        disabled={!inStock}
                        className="flex-shrink-0 h-8 px-3 text-xs"
                      >
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
