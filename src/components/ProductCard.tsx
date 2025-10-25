import { useState, useRef } from 'react';
import { Minus, Plus, ShoppingCart, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCartStore } from '@/store/useCartStore';
import { Product } from '../services/productService';
import productService from '../services/productService';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

// Add styles for ProductCard buttons
const cardButtonStyles = `
  .product-card-buttons button,
  .product-card-buttons a {
    min-height: 33px;
    min-width: 19px;
  }
`;

const ProductCard = ({ product }: ProductCardProps) => {
  const [quantity, setQuantity] = useState(1);
  const [quantityError, setQuantityError] = useState<string>('');
  const [imageError, setImageError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const addItem = useCartStore((state) => state.addItem);

  const price = product.sale_price || product.regular_price || product.price;
  const imageUrl = productService.getProductImageUrl(product);
  const stockQuantity = product.stock_quantity;
  const inStock = productService.isProductInStock(product);
  const isOnSale = productService.isProductOnSale(product);
  const discountPercentage = isOnSale ? productService.calculateDiscountPercentage(product.regular_price, product.sale_price) : 0;
  
  const hasValidImage = imageUrl && !imageUrl.includes('placeholder') && !imageError;

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
    <>
      <style>{cardButtonStyles}</style>
      <Card className="overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col h-full">
        <CardContent className="p-0 flex flex-col h-full product-card-buttons">
        {/* Product Image - Fixed Height */}
        <div className="relative w-full h-48 bg-gray-50 flex-shrink-0 border-b border-border">
          {hasValidImage ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-contain p-2"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Pill className="w-20 h-20 text-gray-300" strokeWidth={1.5} />
            </div>
          )}
          {!inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold text-xs">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-2 xs:p-3 space-y-1.5 xs:space-y-2 flex-1 flex flex-col">
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
            <span className="text-muted-foreground">PTR: <span className="font-semibold text-primary">{productService.getFormattedPTR(product)}</span></span>
            <span className="text-muted-foreground">MRP: <span className="font-semibold">{productService.getFormattedMRP(product)}</span></span>
          </div>

          {/* Ultra Responsive Quantity Selector for Small Phones */}
          <div className="flex items-center gap-1 mt-auto">
            <div className="flex items-center border border-border rounded-md overflow-hidden bg-background shadow-sm flex-shrink-0">
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
                  h-[30px] w-[15px]
                  hover:bg-gray-100 active:bg-gray-200 
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-150 ease-in-out
                  flex items-center justify-center shrink-0
                  touch-manipulation select-none
                  border-r border-border
                  text-[10px] font-bold
                "
                aria-label="Decrease quantity"
              >
                &lt;
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
                  px-1
                  w-[35px]
                  min-w-[35px]
                  text-center 
                  text-xs
                  font-bold 
                  border-0 border-x border-border
                  h-[30px]
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
                  h-[30px] w-[15px]
                  hover:bg-gray-100 active:bg-gray-200 
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-150 ease-in-out
                  flex items-center justify-center shrink-0
                  touch-manipulation select-none
                  border-l border-border
                  text-[10px] font-bold
                "
                aria-label="Increase quantity"
              >
                &gt;
              </button>
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="
                flex-1 
                h-[30px]
                bg-primary hover:bg-primary/90 active:bg-primary/80
                font-medium 
                px-2
                transition-all duration-150 ease-in-out
                touch-manipulation
                flex items-center justify-center
              "
              size="sm"
            >
              <ShoppingCart className="w-3.5 h-3.5" strokeWidth={2} />
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
    </>
  );
};

export default ProductCard;
