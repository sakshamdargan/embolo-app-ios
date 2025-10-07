import { useState } from 'react';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCartStore } from '@/store/useCartStore';
import { Product } from '@/utils/api';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);

  const price = product.sale_price || product.regular_price || product.price;
  const imageUrl = product.images?.[0]?.src || '/placeholder.svg';
  const stockQuantity = product.stock_quantity;
  const inStock = product.stock_status === 'instock';

  const handleAddToCart = () => {
    if (!inStock) {
      toast.error('Product is out of stock');
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: price,
      quantity: quantity,
      image: imageUrl,
      stock_quantity: stockQuantity,
      vendorName: product.store?.name || 'Unknown Vendor',
    });

    toast.success(`Added ${quantity} ${product.name} to cart`);
    setQuantity(1);
  };

  const incrementQuantity = () => {
    if (stockQuantity && quantity >= stockQuantity) {
      toast.error('Maximum stock reached');
      return;
    }
    setQuantity((prev) => prev + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
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
              {product.store?.name || 'Vendor'}
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

          {/* Quantity Selector */}
          <div className="flex items-center gap-2 mt-auto">
            <div className="flex items-center border-2 border-border rounded-md overflow-hidden">
              <Button
                size="sm"
                variant="ghost"
                onClick={decrementQuantity}
                disabled={!inStock}
                className="h-9 w-9 p-0 rounded-none hover:bg-gray-100"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <div className="h-9 w-10 flex items-center justify-center bg-gray-50 text-sm font-semibold border-x-2 border-border">
                {quantity}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={incrementQuantity}
                disabled={!inStock}
                className="h-9 w-9 p-0 rounded-none hover:bg-gray-100"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="flex-1 h-9 gap-1 bg-primary hover:bg-primary/90 font-medium text-xs"
              size="sm"
            >
              <ShoppingCart className="w-4 h-4" />
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
