# Eco Swift Cart - Chemist B2B Platform

## Overview

Eco Swift Cart is a high-performance B2B pharmaceutical platform designed specifically for chemists. It provides a secure, scalable solution for managing large product catalogs (80,000+ products) with JWT-based authentication and optimized API endpoints.

## 🚀 Key Features

### Authentication & Security
- **JWT-based Authentication**: Secure token-based authentication system
- **OTP Verification**: Email and WhatsApp OTP verification for login/registration
- **Role-based Access**: Chemist-specific access controls
- **Protected Routes**: Complete application security with route guards

### High-Performance Product Management
- **Infinite Scroll**: Lazy loading with intersection observer
- **Advanced Caching**: React Query with intelligent cache management
- **Optimized API**: Custom WordPress endpoints instead of WooCommerce REST API
- **Search & Filtering**: Real-time search with debouncing and category filters
- **Pagination**: Server-side pagination for large datasets

### User Experience
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Modern UI**: shadcn/ui components with consistent design system
- **Real-time Updates**: Live product availability and pricing

## 🏗️ Architecture

### Frontend (React + TypeScript)
```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth, etc.)
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # API services
├── utils/              # Utility functions
└── types/              # TypeScript type definitions
```

### Backend (WordPress Plugin)
```
wordpress-plugin/eco-swift-chemist-api/
├── includes/
│   ├── class-chemist-auth-controller.php
│   ├── class-chemist-products-controller.php
│   ├── class-chemist-orders-controller.php
│   ├── class-token-service.php
│   └── class-settings.php
└── eco-swift-chemist-api.php
```

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **React Query** for data fetching and caching
- **React Router** for navigation
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Zustand** for state management
- **Axios** for HTTP requests

### Backend
- **WordPress** with custom plugin architecture
- **JWT Authentication** with custom token service
- **Custom REST API** endpoints
- **Gupshup API** for WhatsApp OTP
- **WordPress Transients** for temporary data storage

## 📦 Installation

### Prerequisites
- Node.js 18+
- WordPress 6.0+
- PHP 7.4+
- MySQL 5.7+

### Frontend Setup
```bash
# Clone the repository
git clone <repository-url>
cd eco-swift-cart

# Install dependencies
npm install

# Start development server
npm run dev
```

### WordPress Plugin Setup
1. Copy the `wordpress-plugin/eco-swift-chemist-api/` folder to your WordPress plugins directory
2. Activate the plugin in WordPress admin
3. Configure API settings in WordPress Admin → Settings → Eco Swift Chemist API
4. Set up Gupshup WhatsApp API credentials
5. Configure JWT secret key

## ⚙️ Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
VITE_API_URL=https://your-wordpress-site.com/wp-json/eco-swift/v1
VITE_WP_BASE_URL=https://your-wordpress-site.com
```

### WordPress Plugin Settings
1. **Gupshup API Configuration**:
   - API Key
   - WhatsApp Source Number
   - App Name
   - Template ID

2. **JWT Settings**:
   - Secret Key (auto-generated)
   - Token Expiration (default: 7 days)

## 🔌 API Endpoints

### Authentication
- `POST /wp-json/eco-swift/v1/auth/request-otp` - Request OTP for login
- `POST /wp-json/eco-swift/v1/auth/register-otp` - Request OTP for registration
- `POST /wp-json/eco-swift/v1/auth/login` - Login with OTP
- `POST /wp-json/eco-swift/v1/auth/register` - Register with OTP
- `POST /wp-json/eco-swift/v1/auth/validate` - Validate JWT token
- `POST /wp-json/eco-swift/v1/auth/refresh` - Refresh JWT token

### Products
- `GET /wp-json/eco-swift/v1/products` - Get products with pagination
- `GET /wp-json/eco-swift/v1/products/search` - Search products
- `GET /wp-json/eco-swift/v1/products/{id}` - Get single product
- `GET /wp-json/eco-swift/v1/categories` - Get product categories
- `GET /wp-json/eco-swift/v1/products/featured` - Get featured products

### Orders
- `POST /wp-json/eco-swift/v1/orders` - Create order
- `GET /wp-json/eco-swift/v1/orders` - Get user orders
- `GET /wp-json/eco-swift/v1/orders/{id}` - Get single order
- `PUT /wp-json/eco-swift/v1/orders/{id}/status` - Update order status

## 🚀 Performance Optimizations

### Frontend Optimizations
- **Code Splitting**: Route-based code splitting
- **Lazy Loading**: Components and images loaded on demand
- **Caching Strategy**: Multi-layer caching with React Query
- **Bundle Optimization**: Tree shaking and minification

### Backend Optimizations
- **Custom Endpoints**: Bypasses WooCommerce REST API overhead
- **Database Optimization**: Optimized queries for large datasets
- **Caching**: WordPress transients for temporary data
- **Pagination**: Server-side pagination reduces memory usage
- **JWT Tokens**: Stateless authentication reduces database queries

## 🔐 Security Features

- **JWT Authentication**: Secure, stateless authentication
- **OTP Verification**: Two-factor authentication via email/WhatsApp
- **Role-based Access**: Chemist-only access controls
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configured for secure cross-origin requests

## 📱 Mobile Support

- **Responsive Design**: Mobile-first approach
- **Touch Optimized**: Touch-friendly interface
- **PWA Ready**: Progressive Web App capabilities

## 🧪 Testing

```bash
# Run linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📈 Scalability

### Horizontal Scaling
- **Stateless Architecture**: JWT-based authentication
- **CDN Ready**: Static assets can be served from CDN
- **Database Optimization**: Efficient queries for large datasets

### Vertical Scaling
- **Memory Efficient**: Optimized component rendering
- **CPU Efficient**: Debounced search and lazy loading
- **Network Efficient**: Compressed responses and caching

## 🔄 Version History

### v1.0.0 (Current)
- Initial release with JWT authentication
- High-performance product loading
- Custom WordPress plugin
- Mobile-responsive design
- OTP-based registration/login

---

**Built with ❤️ for the pharmaceutical industry**
