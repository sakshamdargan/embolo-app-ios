import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api, Order } from '@/utils/api';
import { toast } from 'sonner';
import { Package, RotateCw } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useNavigate } from 'react-router-dom';

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await api.getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = (order: Order) => {
    let addedCount = 0;
    order.line_items.forEach((item) => {
      const itemPrice = parseFloat(item.total) / item.quantity;
      addItem({
        id: item.id,
        name: item.name,
        price: itemPrice.toFixed(2),
        quantity: item.quantity,
        image: item.image?.src || '/placeholder.svg',
        stock_quantity: null,
        vendorName: 'Vendor',
      });
      addedCount += item.quantity;
    });
    toast.success(`Added ${addedCount} items to cart from order #${order.id}`);
    navigate('/cart');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'processing':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50" style={{ fontFamily: '"Roboto", sans-serif', fontWeight: 400 }}>
        <main className="container mx-auto px-4 py-6 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#00aa63] p-2 rounded-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
            </div>

            <div className="border-b border-gray-300 pb-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                Review your past purchases and quickly reorder items you love.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="rounded-2xl">
                <CardContent className="p-4 space-y-3">
                  <div className="h-4 bg-muted shimmer rounded w-1/3" />
                  <div className="h-3 bg-muted shimmer rounded w-1/2" />
                  <div className="h-5 bg-muted shimmer rounded w-1/4" />
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
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-[#00aa63] p-2 rounded-lg">
              <Package className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
          </div>
          <div className="border-b border-gray-300 pb-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              Review your past purchases and quickly reorder items you love.
            </p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-xl font-semibold mb-2">No orders yet</p>
            <p className="text-muted-foreground">Your orders will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-lg text-foreground">Order #{order.id}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDate(order.date_created)}
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} text-white px-3 py-1`}>
                      {order.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-3 py-2">
                    {order.line_items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                          {item.image?.src && (
                            <img 
                              src={item.image.src} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-muted-foreground">
                              Qty: {item.quantity}
                            </p>
                            <span className="text-xs text-muted-foreground">•</span>
                            <p className="text-xs font-semibold text-primary">
                              ${parseFloat(item.total).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {order.line_items.length > 3 && (
                      <p className="text-xs text-muted-foreground pl-1">
                        +{order.line_items.length - 3} more items
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <span className="text-xs text-muted-foreground">Total Amount</span>
                      <p className="text-xl font-bold text-primary">
                        ${parseFloat(order.total).toFixed(2)}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleReorder(order)}
                      className="bg-primary hover:bg-primary/90 gap-2"
                      size="lg"
                    >
                      <RotateCw className="w-4 h-4" />
                      Reorder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Orders;
