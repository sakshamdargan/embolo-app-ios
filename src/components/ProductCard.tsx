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
    <Card className="overflow-hidden rounded-2xl shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        {/* Product Image */}
        <div className="relative aspect-square bg-muted">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {!inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-3 space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2 text-foreground">
            {product.name}
          </h3>
          
          <p className="text-xs text-muted-foreground">
            {product.store?.name || 'Vendor'}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-primary">
              {price && parseFloat(price) > 0 ? `$${parseFloat(price).toFixed(2)}` : 'Price on request'}
            </span>
            {stockQuantity && (
              <span className="text-xs text-muted-foreground">
                Stock: {stockQuantity}
              </span>
            )}
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <Button
                size="sm"
                variant="ghost"
                onClick={decrementQuantity}
                disabled={!inStock}
                className="h-8 w-8 p-0 rounded-none"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="px-3 text-sm font-medium min-w-[2rem] text-center">
                {quantity}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={incrementQuantity}
                disabled={!inStock}
                className="h-8 w-8 p-0 rounded-none"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="flex-1 h-8 gap-2 bg-primary hover:bg-primary/90"
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
