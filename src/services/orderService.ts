import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';

// Configure axios for WordPress API
const API_BASE_URL = 'https://embolo.in/wp-json/eco-swift/v1';

// iOS-compatible HTTP client wrapper
const makeRequest = async (config: any): Promise<any> => {
  // Use CapacitorHttp for iOS to avoid CORS issues
  if (Capacitor.isNativePlatform()) {
    const token = localStorage.getItem('eco_swift_token');
    const headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // Build full URL - remove baseURL from config as CapacitorHttp doesn't accept it
    const baseUrl = config.baseURL || API_BASE_URL;
    const url = config.url?.startsWith('http') 
      ? config.url 
      : `${baseUrl}${config.url}`;
    
    console.log(`📱 iOS Order Request: ${config.method || 'GET'} ${url}`);
    
    try {
      // CapacitorHttp only accepts: url, method, headers, data, params, readTimeout, connectTimeout
      const requestOptions: any = {
        method: config.method || 'GET',
        url: url,
        headers: headers,
        readTimeout: 60000,
        connectTimeout: 60000,
      };
      
      // Only add data if it exists (for POST/PUT requests)
      if (config.data) {
        requestOptions.data = config.data;
      }
      
      // Only add params if they exist (for GET requests)
      if (config.params) {
        requestOptions.params = config.params;
      }
      
      const response: HttpResponse = await CapacitorHttp.request(requestOptions);
      
      // Handle sliding session token
      if (response.headers['x-jwt-token']) {
        localStorage.setItem('eco_swift_token', response.headers['x-jwt-token']);
      }
      
      console.log(`📱 iOS Order Response: ${response.status}`, response.data);
      
      // Format response to match axios structure
      return {
        data: response.data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error: any) {
      console.error(`📱 iOS Order Request Error:`, error);
      
      // Handle 401 errors
      if (error.status === 401) {
        localStorage.removeItem('eco_swift_token');
        localStorage.removeItem('eco_swift_user');
      }
      
      throw error;
    }
  }
  
  // Use axios for web
  return axios(config);
};

const orderAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increased to 60 seconds for order creation
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token (for web)
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

// Add response interceptor to handle auth errors (for web)
orderAPI.interceptors.response.use(
  (response) => {
    // 🔄 SLIDING SESSION: Update token if backend sent a new one
    const newToken = response.headers['x-jwt-token'];
    if (newToken) {
      localStorage.setItem('eco_swift_token', newToken);
    }
    
    return response;
  },
  (error) => {
    // 🔄 SLIDING SESSION: Update token even in error responses (if 2xx status)
    if (error.response?.headers?.['x-jwt-token']) {
      const newToken = error.response.headers['x-jwt-token'];
      localStorage.setItem('eco_swift_token', newToken);
    }
    
    // Don't reject if it's actually a successful response (2xx status codes)
    if (error.response?.status >= 200 && error.response?.status < 300) {
      return error.response;
    }
    
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
  vendor_name?: string;
  store_name?: string;
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
  payment_method?: string;
  payment_method_title?: string;
  status?: string;
  meta_data?: Array<{
    key: string;
    value: string;
  }>;
  device_type?: string;
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
      const response = await makeRequest({
        method: 'POST',
        url: '/orders',
        baseURL: API_BASE_URL,
        data: orderData,
        timeout: 60000
      });
      
      // Accept any 2xx response as success
      if (response.status >= 200 && response.status < 300) {
        return response.data;
      }
      throw new Error('Failed to create order');
    } catch (error: any) {
      // Check if it's a timeout error
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('Order is being processed. Please check your orders page in a moment.');
      }
      
      // Some servers return error object even on 2xx, so check for data
      if (error.response && error.response.status >= 200 && error.response.status < 300) {
        return error.response.data;
      }
      
      throw new Error(error.response?.data?.message || 'Failed to create order');
    }
  }

  // Get user orders with pagination
  async getOrders(params: OrdersParams = {}): Promise<OrdersResponse> {
    try {
      const response = await makeRequest({
        method: 'GET',
        url: '/orders',
        baseURL: API_BASE_URL,
        params
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch orders');
    }
  }

  // Get single order
  async getOrder(orderId: number): Promise<OrderResponse> {
    try {
      const response = await makeRequest({
        method: 'GET',
        url: `/orders/${orderId}`,
        baseURL: API_BASE_URL
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch order');
    }
  }

  // Update order status (limited to customer-allowed statuses)
  async updateOrderStatus(orderId: number, status: string): Promise<OrderResponse> {
    try {
      const response = await makeRequest({
        method: 'PUT',
        url: `/orders/${orderId}/status`,
        baseURL: API_BASE_URL,
        data: { status }
      });
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
