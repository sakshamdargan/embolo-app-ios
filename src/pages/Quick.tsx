import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useCartStore } from '@/store/useCartStore';
import { api } from '@/utils/api';
import productService, { Product } from '@/services/productService';
import { toast } from 'sonner';
import { Plus, Trash2, ShoppingCart, Search, X, Package } from 'lucide-react';

interface OrderTemplate {
  id: string;
  name: string;
  products: Array<{
    id: number;
    name: string;
    price: string;
    image: string;
    quantity: number;
    vendorName?: string;
  }>;
  createdAt: string;
}

const Quick = () => {
  const [templates, setTemplates] = useState<OrderTemplate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [quantityErrors, setQuantityErrors] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTimeoutRef, setSearchTimeoutRef] = useState<NodeJS.Timeout | null>(null);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    loadTemplates();
    setLoading(false);
  }, []);

  // Clear search when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedProducts([]);
    }
  }, [isModalOpen]);

  const loadTemplates = () => {
    try {
      const saved = localStorage.getItem('order_templates');
      if (saved) {
        setTemplates(JSON.parse(saved));
      }
    } catch (error) {
      toast.error('Failed to load templates');
    }
  };

  // Server-side search function (like SearchBar component)
  const performServerSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    try {
      setSearchLoading(true);
      const results = await api.searchProducts(query.trim());
      setSearchResults(results.slice(0, 20)); // Limit to 20 results
    } catch (error: any) {
      toast.error('Search failed. Please try again.');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // Clear previous timeout
    if (searchTimeoutRef) {
      clearTimeout(searchTimeoutRef);
    }

    if (!query.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    // Show loading state immediately
    setSearchLoading(true);
    
    // Debounce: wait 400ms after user stops typing before searching
    const timeout = setTimeout(() => {
      performServerSearch(query);
    }, 400);
    
    setSearchTimeoutRef(timeout);
  };

  const handleAddProductToTemplate = (product: Product) => {
    if (selectedProducts.find(p => p.id === product.id)) {
      toast.error('Product already added');
      return;
    }
    
    // Ensure product has a quantity property, default to 1 if not provided
    const productWithQuantity = {
      ...product,
      quantity: (product as any).quantity || 1
    };
    
    setSelectedProducts([...selectedProducts, productWithQuantity]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveProductFromTemplate = (productId: number) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast.error('Template name is required');
      return;
    }
    
    if (selectedProducts.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    const newTemplate: OrderTemplate = {
      id: Date.now().toString(),
      name: templateName,
      products: selectedProducts.map(p => ({
        id: p.id,
        name: p.name,
        price: p.sale_price || p.regular_price || p.price,
        image: p.images?.[0]?.src || '/placeholder.svg',
        quantity: (p as any).quantity || 1,
        vendorName: p.store?.name || 'Unknown Vendor',
      })),
      createdAt: new Date().toISOString(),
    };

    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    localStorage.setItem('order_templates', JSON.stringify(updatedTemplates));
    
    toast.success('Template saved successfully!');
    resetModal();
  };

  const handleDeleteTemplate = (templateId: string) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    setTemplates(updatedTemplates);
    localStorage.setItem('order_templates', JSON.stringify(updatedTemplates));
    toast.success('Template deleted');
  };

  const handleAddAllToCart = (template: OrderTemplate) => {
    template.products.forEach(product => {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price, // Template already has the correct price
        quantity: product.quantity,
        image: product.image,
        stock_quantity: null,
        vendorName: product.vendorName || 'Unknown Vendor',
      });
    });
    toast.success(`Added ${template.products.length} items to cart from "${template.name}"`);
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setTemplateName('');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedProducts([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50" style={{ fontFamily: '"Roboto", sans-serif', fontWeight: 400 }}>
        <main className="container mx-auto px-4 py-6 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-[#00aa63] p-2 rounded-lg">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Cart Templates</h1>
              </div>
              <Button
                disabled
                className="bg-primary hover:bg-primary/90 shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </Button>
            </div>

            <div className="border-b border-gray-300 pb-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                Create reusable order templates for faster checkout.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="rounded-2xl">
                <CardContent className="p-4">
                  <div className="h-32 bg-muted shimmer rounded-lg mb-3" />
                  <div className="h-4 bg-muted shimmer rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: '"Roboto", sans-serif', fontWeight: 400 }}>
      <main className="container mx-auto px-4 py-6 space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-[#00aa63] p-2 rounded-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Cart Templates</h1>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary/90 shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>

          <div className="border-b border-gray-300 pb-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              Create reusable order templates for faster checkout.
            </p>
          </div>
        </div>


        {templates.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No templates yet</h3>
            <p className="text-muted-foreground mb-6">Create your first template to get started!</p>
            <Button onClick={() => setIsModalOpen(true)} className="shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-lg flex-1">{template.name}</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {template.products.length} product{template.products.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                    {template.products.map((product) => (
                      <div key={product.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground mb-1 truncate">
                            {product.vendorName || 'Unknown Vendor'}
                          </p>
                          <p className="text-xs text-primary">
                            PTR: ₹{parseFloat(product.price || '0').toFixed(2)}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">Qty: {product.quantity}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-4 pt-0">
                    <Button
                      onClick={() => handleAddAllToCart(template)}
                      className="w-full shadow-md"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add All to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create Template Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col fixed-center">
          <DialogHeader className="flex-shrink-0 pb-2">
            <DialogTitle className="text-base sm:text-lg">Create New Template</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4 overflow-y-auto flex-1 min-h-0 px-1">
            {/* Template Name */}
            <div className="flex-shrink-0">
              <label className="text-sm font-medium mb-1.5 block">Template Name*</label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. Weekly Meds"
                className="w-full h-9 text-sm focus-visible:ring-1 focus-visible:ring-offset-1"
              />
            </div>

            {/* Product Search */}
            <div className="flex-shrink-0">
              <label className="text-sm font-medium mb-1.5 block">Search Products*</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search products..."
                  className="pl-10 h-9 text-sm focus-visible:ring-1 focus-visible:ring-offset-1"
                />
              </div>
              
              {/* Search Results */}
              {(searchLoading || searchResults.length > 0 || (searchQuery.trim() && !searchLoading)) && (
                <div className="mt-2 border rounded-lg h-48 sm:h-64 overflow-y-auto bg-card flex-shrink-0">
                  {searchLoading ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Loading products...
                    </div>
                  ) : searchResults.length === 0 && searchQuery.trim() ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No products found
                    </div>
                  ) : (
                    searchResults.map((product) => {
                      const ptr = productService.getFormattedPTR(product);
                      const mrp = productService.getFormattedMRP(product);
                      const hasDiscount = productService.hasDiscount(product);
                      const imageUrl = product.images?.[0]?.src || '/placeholder.svg';
                      
                      return (
                        <div
                          key={product.id}
                          className="flex items-center gap-2 p-2 hover:bg-muted/50 cursor-pointer transition-colors border-b last:border-b-0"
                          onClick={(e) => {
                            // Don't trigger if clicking on quantity controls
                            if ((e.target as HTMLElement).closest('.quantity-controls')) {
                              return;
                            }
                            
                            // Get quantity from the input field in this row
                            const input = (e.currentTarget as HTMLElement).querySelector('input[type="number"]') as HTMLInputElement;
                            const qtyVal = input ? Number(input.value || '1') : 1;
                            const productWithQty = { ...product, quantity: qtyVal };
                            handleAddProductToTemplate(productWithQty as any);
                          }}
                        >
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs sm:text-sm truncate">{product.name}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 truncate">
                              {product.store?.name || 'Unknown Vendor'}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] sm:text-xs">
                              <span className="text-muted-foreground">PTR: <span className="font-semibold text-primary">{ptr}</span></span>
                              <span className="text-muted-foreground">MRP: <span className="font-semibold">{mrp}</span></span>
                            </div>
                          </div>
                          
                          {/* Compact Quantity Selector */}
                          <div className="flex items-center gap-1 flex-shrink-0 quantity-controls">
                            <div className="flex items-center border border-border rounded overflow-hidden">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const input = (e.currentTarget.nextSibling as HTMLInputElement);
                                  const current = Number(input?.value || '1');
                                  const next = Math.max(1, current - 1);
                                  if (input) input.value = String(next);
                                }}
                                className="h-6 w-6 text-xs hover:bg-gray-100 flex items-center justify-center"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min="1"
                                max={product.stock_quantity || 999}
                                defaultValue="1"
                                className="w-8 text-center text-[10px] font-semibold border-x border-border h-6 bg-transparent focus:outline-none"
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 1;
                                  const maxStock = product.stock_quantity || 999;
                                  if (value > maxStock) {
                                    e.target.value = String(maxStock);
                                    setQuantityErrors(prev => ({
                                      ...prev,
                                      [product.id]: `Maximum available: ${maxStock}`
                                    }));
                                    // Clear error after 3 seconds
                                    setTimeout(() => {
                                      setQuantityErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors[product.id];
                                        return newErrors;
                                      });
                                    }, 3000);
                                  } else if (value < 1) {
                                    e.target.value = '1';
                                  } else {
                                    // Clear any existing error for this product
                                    setQuantityErrors(prev => {
                                      const newErrors = { ...prev };
                                      delete newErrors[product.id];
                                      return newErrors;
                                    });
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const input = (e.currentTarget.previousSibling as HTMLInputElement);
                                  const current = Number(input?.value || '1');
                                  const maxStock = product.stock_quantity || 999;
                                  const next = Math.min(maxStock, current + 1);
                                  if (input) input.value = String(next);
                                  if (next === maxStock && current < maxStock) {
                                    setQuantityErrors(prev => ({
                                      ...prev,
                                      [product.id]: `Maximum available: ${maxStock}`
                                    }));
                                    // Clear error after 3 seconds
                                    setTimeout(() => {
                                      setQuantityErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors[product.id];
                                        return newErrors;
                                      });
                                    }, 3000);
                                  }
                                }}
                                className="h-6 w-6 text-xs hover:bg-gray-100 flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-6 px-2 text-[10px]"
                              onClick={(e) => {
                                e.stopPropagation();
                                const input = (e.currentTarget.previousSibling as HTMLElement)?.querySelector('input') as HTMLInputElement | null;
                                const qtyVal = input ? Number(input.value || '1') : 1;
                                // Create a product with quantity for template
                                const productWithQty = { ...product, quantity: qtyVal };
                                handleAddProductToTemplate(productWithQty as any);
                              }}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          {/* Inline quantity error message */}
                          {quantityErrors[product.id] && (
                            <div className="text-xs text-red-500 mt-1 px-1">
                              {quantityErrors[product.id]}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Selected Products */}
            {selectedProducts.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Selected Products ({selectedProducts.length})
                </label>
                <div className="border rounded-lg p-2 sm:p-3 space-y-2 h-32 sm:h-48 overflow-y-auto bg-muted/10 flex-shrink-0">
                  {selectedProducts.map((product) => {
                    const ptr = productService.getFormattedPTR(product);
                    const mrp = productService.getFormattedMRP(product);
                    const hasDiscount = productService.hasDiscount(product);
                    const sellingPrice = productService.getSellingPrice(product);
                    const imageUrl = product.images?.[0]?.src || '/placeholder.svg';
                    
                    return (
                      <div
                        key={product.id}
                        className="flex items-center gap-2 p-2 bg-card rounded-lg"
                      >
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm truncate">{product.name}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 truncate">
                            {product.store?.name || 'Unknown Vendor'}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] sm:text-xs mb-1">
                            <span className="text-muted-foreground">PTR: <span className="font-semibold text-primary">{ptr}</span></span>
                            <span className="text-muted-foreground">MRP: <span className="font-semibold">{mrp}</span></span>
                          </div>
                          <p className="text-[10px] sm:text-xs text-primary font-medium">
                            Qty: {(product as any).quantity} × {ptr} = ₹{((product as any).quantity * parseFloat(sellingPrice || '0')).toFixed(2)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveProductFromTemplate(product.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0 pt-3 gap-2 sm:gap-4">
            <Button variant="outline" onClick={resetModal} className="h-9 text-sm flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} className="h-9 text-sm flex-1 sm:flex-none">
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Quick;
