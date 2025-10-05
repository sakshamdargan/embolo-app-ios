# Easdeal Mobile App - Setup Guide

## Overview
Easdeal is a modern e-commerce mobile app built with React, Capacitor, WooCommerce REST API, and Dokan API. The app provides a complete shopping experience with product browsing, search, cart management, and order tracking.

## Configuration

### 1. WooCommerce API Setup

Edit `src/utils/api.ts` and update the following constants:

```typescript
const WC_BASE_URL = 'https://yourdomain.com/wp-json/wc/v3';
const DOKAN_BASE_URL = 'https://yourdomain.com/wp-json/dokan/v1';
const CONSUMER_KEY = 'your_consumer_key_here';
const CONSUMER_SECRET = 'your_consumer_secret_here';
```

### 2. Getting WooCommerce API Keys

1. Log in to your WordPress admin panel
2. Go to WooCommerce → Settings → Advanced → REST API
3. Click "Add key"
4. Set Description: "Easdeal Mobile App"
5. Set User: Your admin user
6. Set Permissions: Read/Write
7. Click "Generate API key"
8. Copy the Consumer Key and Consumer Secret

### 3. Capacitor Configuration

The Capacitor config is already set up in `capacitor.config.ts`. To initialize Capacitor for the first time:

```bash
npx cap init
```

### 4. Building for Android

```bash
# Install dependencies
npm install

# Build the web app
npm run build

# Add Android platform (first time only)
npx cap add android

# Sync changes
npx cap sync

# Open in Android Studio
npx cap open android
```

### 5. Building for iOS (Mac only)

```bash
# Add iOS platform (first time only)
npx cap add ios

# Sync changes
npx cap sync

# Open in Xcode
npx cap open ios
```

## Features

### Home Page
- Featured products grid
- Search bar with navigation to search page
- Product cards with add-to-cart functionality
- Stock quantity display

### Search Page
- Real-time fuzzy search using Fuse.js
- Search results with product cards
- Direct add-to-cart from search results

### Cart Page
- View all cart items
- Adjust quantities
- Remove items
- Total price calculation
- Checkout (creates COD orders)

### Orders Page
- View order history
- Order status tracking
- Order details with items

### Quick Page
- Browse categories
- View top vendors/stores
- Quick access shortcuts

### Assistance Page
- FAQs accordion
- Contact support (email, WhatsApp, phone)
- Help center link

## State Management

The app uses Zustand for state management with two main stores:

- `useCartStore`: Manages cart items with localStorage persistence
- `useProductStore`: Manages products, categories, and stores

## API Integration

All API calls are centralized in `src/utils/api.ts`:

- `getProducts()`: Fetch products
- `searchProducts()`: Search products
- `getCategories()`: Fetch categories
- `getStores()`: Fetch Dokan vendors
- `createOrder()`: Create COD order
- `getOrders()`: Fetch user orders

## Design System

The app uses a green and white theme:
- Primary: #00aa63 (green)
- Background: #f5f5f5 (light grey)
- Font: Poppins

All design tokens are defined in:
- `src/index.css`: CSS variables and utilities
- `tailwind.config.ts`: Tailwind theme extensions

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Production Checklist

Before deploying:
1. ✅ Update API credentials in `src/utils/api.ts`
2. ✅ Update Capacitor app ID in `capacitor.config.ts`
3. ✅ Test all API endpoints
4. ✅ Test on physical devices
5. ✅ Update contact information in Assistance page
6. ✅ Configure proper error handling
7. ✅ Add analytics (optional)
8. ✅ Set up crash reporting (optional)

## Troubleshooting

### CORS Errors
If you encounter CORS errors, ensure your WordPress site has proper CORS headers configured.

### API Authentication Failed
- Verify your Consumer Key and Consumer Secret
- Check that the API user has proper permissions
- Ensure WooCommerce REST API is enabled

### Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf dist && npm run build`

## Support

For issues or questions:
- Check the FAQ in the Assistance page
- Contact: support@easdeal.com
- WhatsApp: +1234567890

## License

This project is created for Easdeal marketplace.
