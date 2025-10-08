import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/useCartStore';
import { useVendorStore } from '@/store/useVendorStore';
import { api, Product } from '@/utils/api';
import { toast } from 'sonner';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSearch?: () => void;
}

const SearchBar = ({ value, onChange, placeholder = "Search products...", onSearch }: SearchBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const addItem = useCartStore((state) => state.addItem);
  const { selectedVendorIds, allVendorsSelected } = useVendorStore();

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Server-side search function
  const performServerSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const vendorIds = allVendorsSelected ? undefined : selectedVendorIds;
      const results = await api.searchProducts(query.trim(), vendorIds);
      
      // Server-side filtering is already applied, no need for client-side filtering
      if (results && results.length > 0) {
        setSearchResults(results);
        setIsOpen(true);
      } else {
        setSearchResults([]);
        setIsOpen(true); // Still show dropdown with "no results" message
      }
    } catch (error: any) {
      console.error('Search error:', error);
      console.error('Error details:', error?.response?.data || error?.message);
      
      // Show user-friendly error
      const errorMessage = error?.response?.data?.message || error?.message || 'Search failed';
      toast.error(`Search error: ${errorMessage}`);
      
      setSearchResults([]);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    onChange(query);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setSearchResults([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    // Show loading state immediately
    setLoading(true);
    
    // Debounce: wait 400ms after user stops typing before searching
    searchTimeoutRef.current = setTimeout(() => {
      performServerSearch(query);
    }, 400);
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
      vendorName: product.store?.name || 'Embolo',
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
      <div className="relative rounded-[12px] overflow-hidden bg-[#dfdfdf] transition-all duration-300 shadow-none border border-transparent">
        <Search 
          className={`absolute top-1/2 transform -translate-y-1/2 text-gray-600 w-6 h-6 transition-all duration-300 ease-in-out ${
            value ? 'right-3 opacity-100' : 'left-3 opacity-100'
          }`}
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => value.trim() && setIsOpen(true)}
          placeholder={placeholder}
          className={`h-12 rounded-none bg-transparent text-gray-900 placeholder:text-gray-500 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none transition-all duration-300 ${
            value ? 'pl-3 pr-10' : 'pl-10 pr-3'
          }`}
        />
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-0 bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading products...
            </div>
          ) : searchResults.length === 0 ? (
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
              {searchResults.map((product) => {
                const price = product.sale_price || product.regular_price || product.price;
                const imageUrl = product.images?.[0]?.src || '/placeholder.svg';
                const inStock = product.stock_status === 'instock';
                const [qty, setQty] = [1, (n:number)=>n]; // placeholder to satisfy TS in map scope

                return (
                  <div
                    key={product.id}
                    className="flex flex-col gap-2 p-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                  >
                    {/* Product Info */}
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm leading-tight mb-1.5">
                        {product.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-1">
                        {product.store?.name || 'Unknown Vendor'}
                      </p>
                      <div className="flex items-center justify-between text-xs gap-4">
                        <span className="text-muted-foreground">PTR: ₹{product.regular_price || '0'}</span>
                        <span className="text-muted-foreground">MRP: ₹{parseFloat(price || '0').toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Quantity Selector + Add Button */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border-2 border-border rounded-md overflow-hidden">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            const input = (e.currentTarget.nextSibling as HTMLInputElement);
                            const current = Number(input?.value || '1');
                            const next = Math.max(1, current - 1);
                            if (input) input.value = String(next);
                          }}
                          className="h-9 w-9 text-sm hover:bg-gray-100"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={product.stock_quantity || 999}
                          defaultValue="1"
                          className="px-2 min-w-[3rem] text-center text-sm font-semibold border-x-2 border-border h-9 bg-transparent focus:outline-none"
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 1;
                            const maxStock = product.stock_quantity || 999;
                            if (value > maxStock) {
                              e.target.value = String(maxStock);
                              toast.error(`Maximum available quantity is ${maxStock}`);
                            } else if (value < 1) {
                              e.target.value = '1';
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            const input = (e.currentTarget.previousSibling as HTMLInputElement);
                            const current = Number(input?.value || '1');
                            const maxStock = product.stock_quantity || 999;
                            const next = Math.min(maxStock, current + 1);
                            if (input) input.value = String(next);
                            if (next === maxStock && current < maxStock) {
                              toast.error(`Maximum available quantity is ${maxStock}`);
                            }
                          }}
                          className="h-9 w-9 text-sm hover:bg-gray-100"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          const input = (e.currentTarget.previousSibling as HTMLElement)?.querySelector('input') as HTMLInputElement | null;
                          const qtyVal = input ? Number(input.value || '1') : 1;
                          // Add to cart with specified quantity
                          for (let i = 0; i < Math.max(1, qtyVal); i++) handleAddToCart(product);
                        }}
                        disabled={!inStock}
                        className="flex-1 h-9 gap-1 bg-primary hover:bg-primary/90 font-medium text-xs"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
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
