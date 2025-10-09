import { useState, useRef } from 'react';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCartStore } from '@/store/useCartStore';
import { Product } from '../services/productService';
import productService from '../services/productService';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [quantity, setQuantity] = useState(1);
  const [quantityError, setQuantityError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const addItem = useCartStore((state) => state.addItem);

  const price = product.sale_price || product.regular_price || product.price;
  const imageUrl = productService.getProductImageUrl(product);
  const stockQuantity = product.stock_quantity;
  const inStock = productService.isProductInStock(product);
  const isOnSale = productService.isProductOnSale(product);
  const discountPercentage = isOnSale ? productService.calculateDiscountPercentage(product.regular_price, product.sale_price) : 0;

  const handleAddToCart = () => {
    if (!inStock) {
      toast.error('Product is out of stock');
      return;
    }

    // Get the current quantity from the input field
    const currentQuantity = inputRef.current ? parseInt(inputRef.current.value) || 1 : quantity;

    addItem({
      id: product.id,
      name: product.name,
      price: price,
      quantity: currentQuantity,
      image: imageUrl,
      stock_quantity: stockQuantity,
      vendorName: product.store?.name || 'Unknown Vendor',
    });

    toast.success(`Added ${currentQuantity} ${product.name} to cart`);
    
    // Reset both state and input field
    setQuantity(1);
    if (inputRef.current) {
      inputRef.current.value = '1';
    }
  };



  return (
    <Card className="overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col h-full">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Product Image - Fixed Height */}
        <div className="relative w-full h-48 bg-white flex-shrink-0 border-b border-border">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-contain p-2"
          />
          {!inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold text-xs">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-3 space-y-2 flex-1 flex flex-col">
          <h3 className="font-semibold text-sm line-clamp-2 text-foreground h-10">
            {product.name}
          </h3>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {product.store?.name || 'Unknown Vendor'}
            </p>
            {stockQuantity && (
              <p className="text-xs text-muted-foreground">
                Stock: {stockQuantity}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">PTR: ₹0</span>
            <span className="text-muted-foreground">MRP: ₹0</span>
          </div>

          {/* Responsive Quantity Selector */}
          <div className="flex items-center gap-1 sm:gap-2 mt-auto">
            <div className="flex items-center border-2 border-border rounded-md overflow-hidden bg-background">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  const input = (e.currentTarget.nextSibling as HTMLInputElement);
                  const current = Number(input?.value || '1');
                  const next = Math.max(1, current - 1);
                  if (input) input.value = String(next);
                  setQuantity(next);
                }}
                disabled={!inStock}
                className="
                  h-7 w-7 xs:h-8 xs:w-8 sm:h-9 sm:w-9 
                  text-xs sm:text-sm 
                  hover:bg-gray-100 active:bg-gray-200 
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-150 ease-in-out
                  flex items-center justify-center
                  touch-manipulation
                "
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" />
              </button>
              <input
                ref={inputRef}
                type="number"
                min="1"
                max={stockQuantity || 999}
                defaultValue={quantity}
                onFocus={(e) => {
                  e.target.select();
                }}
                onBlur={(e) => {
                  if (!e.target.value || e.target.value === '' || parseInt(e.target.value) < 1) {
                    e.target.value = '1';
                    setQuantity(1);
                  } else {
                    const value = parseInt(e.target.value);
                    setQuantity(value);
                  }
                }}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  const maxStock = stockQuantity || 999;
                  if (value > maxStock) {
                    e.target.value = String(maxStock);
                    setQuantity(maxStock);
                    setQuantityError(`Maximum available: ${maxStock}`);
                    // Clear error after 3 seconds
                    setTimeout(() => setQuantityError(''), 3000);
                  } else if (value < 1 && e.target.value !== '') {
                    e.target.value = '1';
                    setQuantity(1);
                  } else {
                    // Clear any existing error
                    setQuantityError('');
                  }
                }}
                className="
                  px-1 xs:px-1.5 sm:px-2 
                  min-w-[2rem] xs:min-w-[2.5rem] sm:min-w-[3rem] 
                  w-8 xs:w-10 sm:w-12
                  text-center 
                  text-xs xs:text-sm sm:text-sm 
                  font-semibold 
                  border-x-2 border-border 
                  h-7 xs:h-8 sm:h-9 
                  bg-transparent 
                  focus:outline-none focus:bg-gray-50
                  transition-colors duration-150
                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                "
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  const input = (e.currentTarget.previousSibling as HTMLInputElement);
                  const current = Number(input?.value || '1');
                  const maxStock = stockQuantity || 999;
                  const next = Math.min(maxStock, current + 1);
                  if (input) input.value = String(next);
                  setQuantity(next);
                  if (next === maxStock && current < maxStock) {
                    setQuantityError(`Maximum available: ${maxStock}`);
                    // Clear error after 3 seconds
                    setTimeout(() => setQuantityError(''), 3000);
                  }
                }}
                disabled={!inStock}
                className="
                  h-7 w-7 xs:h-8 xs:w-8 sm:h-9 sm:w-9 
                  text-xs sm:text-sm 
                  hover:bg-gray-100 active:bg-gray-200 
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-150 ease-in-out
                  flex items-center justify-center
                  touch-manipulation
                "
                aria-label="Increase quantity"
              >
                <Plus className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="
                flex-1 
                h-7 xs:h-8 sm:h-9 
                gap-0.5 xs:gap-1 sm:gap-1 
                bg-primary hover:bg-primary/90 active:bg-primary/80
                font-medium 
                text-[10px] xs:text-xs sm:text-xs
                px-1 xs:px-2 sm:px-3
                transition-all duration-150 ease-in-out
                touch-manipulation
              "
              size="sm"
            >
              <ShoppingCart className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Add</span>
              <span className="xs:hidden">+</span>
            </Button>
          </div>
          {/* Inline quantity error message */}
          {quantityError && (
            <div className="text-xs text-red-500 mt-2 px-3">
              {quantityError}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
