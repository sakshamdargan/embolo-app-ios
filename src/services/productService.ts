import axios from 'axios';

// Configure axios for WordPress API
const API_BASE_URL = 'https://embolo.in/wp-json/eco-swift/v1';

const productAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
productAPI.interceptors.request.use(
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
productAPI.interceptors.response.use(
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

export interface ProductImage {
  id: number;
  src: string;
  alt: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
}

export interface ProductDimensions {
  length: string;
  width: string;
  height: string;
}

export interface ProductAttribute {
  name: string;
  options: string[];
  visible: boolean;
  variation: boolean;
}

export interface ProductVariation {
  id: number;
  price: string;
  regular_price: string;
  sale_price: string;
  stock_status: string;
  stock_quantity: number | null;
  attributes: Record<string, string>;
  image: ProductImage | null;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  sale_price: string;
  price_html: string;
  on_sale: boolean;
  stock_status: string;
  stock_quantity: number | null;
  manage_stock: boolean;
  images: ProductImage[];
  categories: ProductCategory[];
  short_description: string;
  description?: string;
  sku: string;
  weight: string;
  dimensions: ProductDimensions;
  attributes?: ProductAttribute[];
  variations?: ProductVariation[];
  related_ids?: number[];
  store?: {
    id: number;
    name: string;
    url: string;
  };
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  image: { src: string } | null;
}

export interface PaginationInfo {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
  has_more: boolean;
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  pagination: PaginationInfo;
}

export interface ProductResponse {
  success: boolean;
  data: Product;
}

export interface CategoriesResponse {
  success: boolean;
  data: Category[];
}

export interface SearchResponse {
  success: boolean;
  data: Product[];
  pagination: PaginationInfo;
  query: string;
}

export interface ProductsParams {
  page?: number;
  per_page?: number;
  search?: string;
  category?: number;
  vendor?: string | number; // Support vendor filtering
  orderby?: 'date' | 'title' | 'price' | 'popularity' | 'rating';
  order?: 'ASC' | 'DESC';
}

export interface SearchParams {
  q: string;
  page?: number;
  per_page?: number;
  vendor?: string | number; // Support vendor filtering in search
}

export interface VendorsParams {
  per_page?: number;
  search?: string;
}

export interface Vendor {
  id: number;
  store_name: string;
  vendor_name: string;
  email: string;
  address: {
    street_1: string;
    city: string;
    country: string;
  };
}

export interface VendorsResponse {
  success: boolean;
  data: Vendor[];
  total: number;
}

class ProductService {
  // Get products with pagination and filtering
  async getProducts(params: ProductsParams = {}): Promise<ProductsResponse> {
    try {
      const response = await productAPI.get('/products', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch products');
    }
  }

  // Search products
  async searchProducts(params: SearchParams): Promise<SearchResponse> {
    try {
      const response = await productAPI.get('/products/search', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to search products');
    }
  }

  // Get single product
  async getProduct(id: number): Promise<ProductResponse> {
    try {
      const response = await productAPI.get(`/products/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch product');
    }
  }

  // Get categories
  async getCategories(params: { per_page?: number; hide_empty?: boolean } = {}): Promise<CategoriesResponse> {
    try {
      const response = await productAPI.get('/categories', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch categories');
    }
  }

  // Get vendors/wholesalers
  async getVendors(params: VendorsParams = {}): Promise<VendorsResponse> {
    try {
      const response = await productAPI.get('/vendors', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch vendors');
    }
  }

  // Get featured products
  async getFeaturedProducts(per_page: number = 10): Promise<ProductsResponse> {
    try {
      const response = await productAPI.get('/products/featured', { 
        params: { per_page } 
      });
      return {
        success: response.data.success,
        data: response.data.data,
        pagination: {
          current_page: 1,
          per_page,
          total_items: response.data.data.length,
          total_pages: 1,
          has_more: false
        }
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch featured products');
    }
  }

  // Get related products
  async getRelatedProducts(productId: number): Promise<Product[]> {
    try {
      const productResponse = await this.getProduct(productId);
      const relatedIds = productResponse.data.related_ids || [];
      
      if (relatedIds.length === 0) {
        return [];
      }

      // Fetch related products
      const relatedProducts: Product[] = [];
      for (const id of relatedIds.slice(0, 4)) { // Limit to 4 related products
        try {
          const response = await this.getProduct(id);
          relatedProducts.push(response.data);
        } catch (error) {
          // Skip if product not found
          console.warn(`Failed to fetch related product ${id}`);
        }
      }

      return relatedProducts;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch related products');
    }
  }

  // Get products by category
  async getProductsByCategory(categoryId: number, params: Omit<ProductsParams, 'category'> = {}): Promise<ProductsResponse> {
    return this.getProducts({ ...params, category: categoryId });
  }

  // Check product availability
  async checkProductAvailability(productId: number, quantity: number = 1): Promise<boolean> {
    try {
      const response = await this.getProduct(productId);
      const product = response.data;
      
      if (product.stock_status !== 'instock') {
        return false;
      }

      if (product.manage_stock && product.stock_quantity !== null) {
        return product.stock_quantity >= quantity;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // Format price for display
  formatPrice(price: string | number): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numPrice);
  }

  // Calculate discount percentage
  calculateDiscountPercentage(regularPrice: string, salePrice: string): number {
    const regular = parseFloat(regularPrice);
    const sale = parseFloat(salePrice);
    
    if (regular <= 0 || sale <= 0 || sale >= regular) {
      return 0;
    }
    
    return Math.round(((regular - sale) / regular) * 100);
  }

  // Get product image URL with fallback
  getProductImageUrl(product: Product, size: 'thumbnail' | 'medium' | 'large' = 'medium'): string {
    if (product.images && product.images.length > 0) {
      return product.images[0].src;
    }
    
    // Return placeholder image
    return '/placeholder-product.jpg';
  }

  // Check if product is in stock
  isProductInStock(product: Product): boolean {
    return product.stock_status === 'instock';
  }

  // Check if product is on sale
  isProductOnSale(product: Product): boolean {
    return product.on_sale && !!product.sale_price;
  }

  // Get stock status text
  getStockStatusText(product: Product): string {
    switch (product.stock_status) {
      case 'instock':
        return 'In Stock';
      case 'outofstock':
        return 'Out of Stock';
      case 'onbackorder':
        return 'On Backorder';
      default:
        return 'Unknown';
    }
  }

  // Get stock status color
  getStockStatusColor(product: Product): string {
    switch (product.stock_status) {
      case 'instock':
        return 'text-green-600';
      case 'outofstock':
        return 'text-red-600';
      case 'onbackorder':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  }
}

export default new ProductService();
