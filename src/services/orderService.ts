import axios from 'axios';

// Configure axios for WordPress API
const API_BASE_URL = 'https://embolo.in/wp-json/eco-swift/v1';

const orderAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
orderAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('eco_swift_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
orderAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('eco_swift_token');
      localStorage.removeItem('eco_swift_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface OrderLineItem {
  id?: number;
  product_id: number;
  variation_id?: number;
  name: string;
  quantity: number;
  subtotal: string;
  total: string;
  price: string;
  image?: { src: string } | null;
  sku: string;
}

export interface OrderAddress {
  first_name: string;
  last_name: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email?: string;
  phone?: string;
}

export interface OrderNote {
  id: number;
  content: string;
  customer_note: boolean;
  date_created: string;
}

export interface Order {
  id: number;
  order_number: string;
  status: string;
  status_label: string;
  date_created: string;
  date_modified: string;
  total: string;
  subtotal: string;
  tax_total: string;
  shipping_total: string;
  currency: string;
  payment_method: string;
  payment_method_title: string;
  line_items: OrderLineItem[];
  billing: OrderAddress;
  shipping: OrderAddress;
  customer_note?: string;
  order_notes?: OrderNote[];
  meta_data?: any[];
}

export interface CreateOrderData {
  line_items: Array<{
    product_id: number;
    quantity: number;
    variation_id?: number;
  }>;
  billing: OrderAddress;
  shipping?: OrderAddress;
}

export interface PaginationInfo {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
  has_more: boolean;
}

export interface OrdersResponse {
  success: boolean;
  data: Order[];
  pagination: PaginationInfo;
}

export interface OrderResponse {
  success: boolean;
  data: Order;
  message?: string;
}

export interface OrdersParams {
  page?: number;
  per_page?: number;
  status?: string;
}

class OrderService {
  // Create a new order
  async createOrder(orderData: CreateOrderData): Promise<OrderResponse> {
    try {
      const response = await orderAPI.post('/orders', orderData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create order');
    }
  }

  // Get user orders with pagination
  async getOrders(params: OrdersParams = {}): Promise<OrdersResponse> {
    try {
      const response = await orderAPI.get('/orders', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch orders');
    }
  }

  // Get single order
  async getOrder(orderId: number): Promise<OrderResponse> {
    try {
      const response = await orderAPI.get(`/orders/${orderId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch order');
    }
  }

  // Update order status (limited to customer-allowed statuses)
  async updateOrderStatus(orderId: number, status: string): Promise<OrderResponse> {
    try {
      const response = await orderAPI.put(`/orders/${orderId}/status`, { status });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update order status');
    }
  }

  // Cancel order
  async cancelOrder(orderId: number): Promise<OrderResponse> {
    return this.updateOrderStatus(orderId, 'cancelled');
  }

  // Get order status color
  getOrderStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'on-hold':
        return 'text-orange-600 bg-orange-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'refunded':
        return 'text-purple-600 bg-purple-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  // Get order status icon
  getOrderStatusIcon(status: string): string {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'processing':
        return '🔄';
      case 'on-hold':
        return '⏸️';
      case 'completed':
        return '✅';
      case 'cancelled':
        return '❌';
      case 'refunded':
        return '💰';
      case 'failed':
        return '❌';
      default:
        return '📦';
    }
  }

  // Check if order can be cancelled
  canCancelOrder(order: Order): boolean {
    const cancellableStatuses = ['pending', 'processing', 'on-hold'];
    return cancellableStatuses.includes(order.status);
  }

  // Format order total
  formatOrderTotal(total: string | number): string {
    const numTotal = typeof total === 'string' ? parseFloat(total) : total;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numTotal);
  }

  // Format order date
  formatOrderDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  // Get order summary
  getOrderSummary(order: Order): {
    itemCount: number;
    totalAmount: string;
    statusColor: string;
    statusIcon: string;
  } {
    const itemCount = order.line_items.reduce((total, item) => total + item.quantity, 0);
    
    return {
      itemCount,
      totalAmount: this.formatOrderTotal(order.total),
      statusColor: this.getOrderStatusColor(order.status),
      statusIcon: this.getOrderStatusIcon(order.status),
    };
  }

  // Calculate order metrics
  calculateOrderMetrics(orders: Order[]): {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    statusBreakdown: Record<string, number>;
  } {
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    
    const statusBreakdown = orders.reduce((breakdown, order) => {
      breakdown[order.status] = (breakdown[order.status] || 0) + 1;
      return breakdown;
    }, {} as Record<string, number>);

    return {
      totalOrders,
      totalSpent,
      averageOrderValue,
      statusBreakdown,
    };
  }

  // Get recent orders
  async getRecentOrders(limit: number = 5): Promise<Order[]> {
    try {
      const response = await this.getOrders({ per_page: limit, page: 1 });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch recent orders:', error);
      return [];
    }
  }

  // Search orders by order number
  async searchOrderByNumber(orderNumber: string): Promise<Order | null> {
    try {
      // Since we don't have a direct search endpoint, we'll fetch recent orders
      // and filter by order number. In a real implementation, you'd want a proper search endpoint.
      const response = await this.getOrders({ per_page: 50 });
      const order = response.data.find(o => 
        o.order_number.toLowerCase().includes(orderNumber.toLowerCase()) ||
        o.id.toString() === orderNumber
      );
      return order || null;
    } catch (error) {
      console.error('Failed to search order:', error);
      return null;
    }
  }

  // Validate order data before creation
  validateOrderData(orderData: CreateOrderData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate line items
    if (!orderData.line_items || orderData.line_items.length === 0) {
      errors.push('Order must contain at least one item');
    }

    orderData.line_items.forEach((item, index) => {
      if (!item.product_id || item.product_id <= 0) {
        errors.push(`Invalid product ID for item ${index + 1}`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Invalid quantity for item ${index + 1}`);
      }
    });

    // Validate billing address
    const requiredBillingFields = ['first_name', 'last_name', 'address_1', 'city', 'postcode', 'country'];
    requiredBillingFields.forEach(field => {
      if (!orderData.billing[field as keyof OrderAddress]) {
        errors.push(`Billing ${field.replace('_', ' ')} is required`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default new OrderService();
